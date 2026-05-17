import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore'
import { Photo, PhotoViewerFilterType } from '@/types/Photo'

interface UsePhotoCollectionProps {
  initialPhotoID: string
  filter?: PhotoViewerFilterType
}

export function usePhotoCollection({
  initialPhotoID,
  filter,
}: UsePhotoCollectionProps) {
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [prevPhoto, setPrevPhoto] = useState<Photo | null>(null)
  const [nextPhoto, setNextPhoto] = useState<Photo | null>(null)
  const [timeoutMessage, setTimeoutMessage] = useState('')
  const [collectionLoading, setCollectionLoading] = useState(true)

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        let q = query(
          collection(db, 'photos'),
          orderBy('sequenceNumber', 'asc')
        )
        if (filter) {
          q = query(
            collection(db, 'photos'),
            where(filter.field, '==', filter.value),
            orderBy('sequenceNumber', 'asc')
          )
        }

        const snapshot = await getDocs(q)
        const allPhotos = snapshot.docs.map(doc => doc.data() as Photo)

        if (!allPhotos.length) {
          setTimeoutMessage('No photos found.')
          return
        }

        const currentIndex = allPhotos.findIndex(p => p.id === initialPhotoID)
        if (currentIndex === -1) {
          setTimeoutMessage('Photo not found.')
          return
        }

        // Current, prev, next photos
        setPhoto(allPhotos[currentIndex])

        const prevIndex =
          currentIndex === 0 ? allPhotos.length - 1 : currentIndex - 1
        const nextIndex =
          currentIndex === allPhotos.length - 1 ? 0 : currentIndex + 1

        setPrevPhoto(allPhotos[prevIndex])
        setNextPhoto(allPhotos[nextIndex])
      } catch (err) {
        console.error(err)
        setTimeoutMessage('Error loading photos.')
      } finally {
        setCollectionLoading(false)
      }
    }

    fetchPhotos()
  }, [initialPhotoID, filter])

  return { photo, prevPhoto, nextPhoto, timeoutMessage, collectionLoading }
}
