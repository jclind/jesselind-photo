import { useEffect, useMemo, useState } from 'react'
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

type CollectionState = {
  // Which photo + filter combination the rest of these fields describe.
  key: string
  photo: Photo | null
  prevPhoto: Photo | null
  nextPhoto: Photo | null
  photoLoading: boolean
  neighborsLoading: boolean
  error: PhotoLoadError | null
}

const requestKey = (photoID: string, filter?: PhotoViewerFilterType) =>
  `${photoID}|${filter?.field ?? ''}|${filter?.value ?? ''}`

// The preload cache is shared across filter scopes, so a cached photo for this
// id only counts as a hit when it also matches the active filter. On a miss the
// caller falls through to fetchOne, which enforces the filter server-side.
const cacheHit = (
  photoID: string,
  filter?: PhotoViewerFilterType
): Photo | null => {
  const cached = usePhotoStore.getState().cache[photoID]
  if (!cached) return null
  if (filter && cached[filter.field] !== filter.value) return null
  return cached
}

// Seeded from the preload cache so that stepping to a neighbor the viewer has
// already prefetched paints that photo on its first render. Without the seed
// the reset below would blank the image for a frame before the effect commits.
const pendingState = (
  photoID: string,
  filter?: PhotoViewerFilterType
): CollectionState => {
  const hit = cacheHit(photoID, filter)
  return {
    key: requestKey(photoID, filter),
    photo: hit,
    prevPhoto: null,
    nextPhoto: null,
    photoLoading: !hit,
    neighborsLoading: true,
    error: null,
  }
}

export function usePhotoCollection({
  initialPhotoID,
  filter,
}: UsePhotoCollectionProps) {
  const filterField = filter?.field
  const filterValue = filter?.value
  // One filter object, rebuilt from the primitives and memoized. Render and the
  // effect both key off this exact value, so the two can't derive keys that
  // disagree and strand the hook in its pending state.
  const activeFilter = useMemo<PhotoViewerFilterType | undefined>(
    () =>
      filterField ? { field: filterField, value: filterValue ?? '' } : undefined,
    [filterField, filterValue]
  )
  const key = requestKey(initialPhotoID, activeFilter)

  const [result, setResult] = useState<CollectionState>(() =>
    pendingState(initialPhotoID, activeFilter)
  )
  // A key mismatch means the caller has moved to a different photo and the
  // effect below has not committed anything for it yet. Reporting the pending
  // state here resets everything in the same render as the id change, so the
  // viewer never paints a frame of the previous photo under the new URL.
  const state =
    result.key === key ? result : pendingState(initialPhotoID, activeFilter)

  useEffect(() => {
    let cancelled = false
    const draft = pendingState(initialPhotoID, activeFilter)
    const commit = (partial: Partial<CollectionState>) => {
      Object.assign(draft, partial)
      setResult({ ...draft })
    }

    const load = async () => {
      const store = usePhotoStore.getState()

      // 1. Current photo — cache hit, else fetch.
      let current: Photo | null = cacheHit(initialPhotoID, activeFilter)

      if (current) {
        commit({ photo: current, photoLoading: false })
      } else {
        try {
          current = await fetchOne(initialPhotoID, activeFilter)
        } catch (err) {
          if (cancelled) return
          console.error(err)
          commit({
            error: 'fetch-failed',
            photoLoading: false,
            neighborsLoading: false,
          })
          return
        }
        if (cancelled) return
        if (!current) {
          commit({
            error: 'not-found',
            photoLoading: false,
            neighborsLoading: false,
          })
          return
        }
        commit({ photo: current, photoLoading: false })
        store.addPhoto(current)
      }

      // 2. Neighbors in parallel — best-effort; failures don't block the viewer
      const results = await Promise.allSettled([
        fetchNeighbor(current.sequenceNumber, 'prev', activeFilter),
        fetchNeighbor(current.sequenceNumber, 'next', activeFilter),
      ])
      if (cancelled) return
      const [prevRes, nextRes] = results
      const neighbors: Partial<CollectionState> = { neighborsLoading: false }
      if (prevRes.status === 'fulfilled' && prevRes.value) {
        neighbors.prevPhoto = prevRes.value
        store.addPhoto(prevRes.value)
      }
      if (nextRes.status === 'fulfilled' && nextRes.value) {
        neighbors.nextPhoto = nextRes.value
        store.addPhoto(nextRes.value)
      }
      commit(neighbors)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [initialPhotoID, activeFilter])

  return {
    photo: state.photo,
    prevPhoto: state.prevPhoto,
    nextPhoto: state.nextPhoto,
    photoLoading: state.photoLoading,
    neighborsLoading: state.neighborsLoading,
    error: state.error,
  }
}
