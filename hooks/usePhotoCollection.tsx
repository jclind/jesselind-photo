import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  type QueryConstraint,
} from 'firebase/firestore/lite'
import { Photo, PhotoLoadError, PhotoViewerFilterType } from '@/types/Photo'
import { usePhotoStore } from '@/store/photoStore'

interface UsePhotoCollectionProps {
  initialPhotoID: string
  filter?: PhotoViewerFilterType
}

const photosRef = collection(db, 'photos')

const filterClause = (filter?: PhotoViewerFilterType): QueryConstraint[] =>
  filter ? [where(filter.field, '==', filter.value)] : []

const fetchOne = async (
  photoID: string,
  filter?: PhotoViewerFilterType
): Promise<Photo | null> => {
  const snap = await getDocs(
    query(photosRef, where('id', '==', photoID), ...filterClause(filter), limit(1))
  )
  return snap.empty ? null : (snap.docs[0].data() as Photo)
}

// Sequence numbers are dense and monotonic per `reSerializePhotos`, so the
// immediate neighbor of seq=K is seq=K±1 when one exists in scope. If that
// neighbor is already in the in-memory cache (matching the active filter when
// present), it's authoritatively the answer — skip the Firestore round-trip.
const findNeighborInCache = (
  sequenceNumber: number,
  direction: 'prev' | 'next',
  filter?: PhotoViewerFilterType
): Photo | null => {
  const targetSeq =
    direction === 'next' ? sequenceNumber + 1 : sequenceNumber - 1
  const cache = usePhotoStore.getState().cache
  for (const id in cache) {
    const photo = cache[id]
    if (photo.sequenceNumber !== targetSeq) continue
    if (filter && photo[filter.field] !== filter.value) continue
    return photo
  }
  return null
}

const fetchNeighbor = async (
  sequenceNumber: number,
  direction: 'prev' | 'next',
  filter?: PhotoViewerFilterType
): Promise<Photo | null> => {
  const cached = findNeighborInCache(sequenceNumber, direction, filter)
  if (cached) return cached

  const op = direction === 'next' ? '>' : '<'
  const dir: 'asc' | 'desc' = direction === 'next' ? 'asc' : 'desc'
  const constraints: QueryConstraint[] = [
    ...filterClause(filter),
    where('sequenceNumber', op, sequenceNumber),
    orderBy('sequenceNumber', dir),
    limit(1),
  ]
  const snap = await getDocs(query(photosRef, ...constraints))
  if (!snap.empty) return snap.docs[0].data() as Photo

  // wrap-around: first when going next, last when going prev
  const wrapSnap = await getDocs(
    query(
      photosRef,
      ...filterClause(filter),
      orderBy('sequenceNumber', dir),
      limit(1)
    )
  )
  return wrapSnap.empty ? null : (wrapSnap.docs[0].data() as Photo)
}

export function usePhotoCollection({
  initialPhotoID,
  filter,
}: UsePhotoCollectionProps) {
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [prevPhoto, setPrevPhoto] = useState<Photo | null>(null)
  const [nextPhoto, setNextPhoto] = useState<Photo | null>(null)
  const [photoLoading, setPhotoLoading] = useState(true)
  const [neighborsLoading, setNeighborsLoading] = useState(true)
  const [error, setError] = useState<PhotoLoadError | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    setPhoto(null)
    setPrevPhoto(null)
    setNextPhoto(null)
    setPhotoLoading(true)
    setNeighborsLoading(true)

    const load = async () => {
      const store = usePhotoStore.getState()

      // 1. Current photo — cache hit, else fetch
      let current: Photo | null = store.cache[initialPhotoID] ?? null

      if (current) {
        setPhoto(current)
        setPhotoLoading(false)
      } else {
        try {
          current = await fetchOne(initialPhotoID, filter)
        } catch (err) {
          if (cancelled) return
          console.error(err)
          setError('fetch-failed')
          setPhotoLoading(false)
          setNeighborsLoading(false)
          return
        }
        if (cancelled) return
        if (!current) {
          setError('not-found')
          setPhotoLoading(false)
          setNeighborsLoading(false)
          return
        }
        setPhoto(current)
        setPhotoLoading(false)
        store.addPhoto(current)
      }

      // 2. Neighbors in parallel — best-effort; failures don't block the viewer
      const results = await Promise.allSettled([
        fetchNeighbor(current.sequenceNumber, 'prev', filter),
        fetchNeighbor(current.sequenceNumber, 'next', filter),
      ])
      if (cancelled) return
      const [prevRes, nextRes] = results
      if (prevRes.status === 'fulfilled' && prevRes.value) {
        setPrevPhoto(prevRes.value)
        store.addPhoto(prevRes.value)
      }
      if (nextRes.status === 'fulfilled' && nextRes.value) {
        setNextPhoto(nextRes.value)
        store.addPhoto(nextRes.value)
      }
      setNeighborsLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [initialPhotoID, filter?.field, filter?.value])

  return { photo, prevPhoto, nextPhoto, photoLoading, neighborsLoading, error }
}
