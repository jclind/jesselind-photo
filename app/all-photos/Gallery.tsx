'use client'

import React from 'react'
import {
  collection,
  query,
  orderBy,
  startAfter,
  limit,
  getDocs,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Photo } from '@/types/Photo'
import GalleryTemplate from '@/components/GalleryTemplate'

const PAGE_SIZE = 20

const Gallery = () => {
  const imagePath = '/all-photos'
  // Firebase-specific fetch function
  const fetchPhotos = async (lastDoc?: QueryDocumentSnapshot) => {
    const photosRef = collection(db, 'photos')

    const q = lastDoc
      ? query(
          photosRef,
          orderBy('sequenceNumber', 'desc'),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        )
      : query(photosRef, orderBy('sequenceNumber', 'desc'), limit(PAGE_SIZE))

    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return { photos: [], lastDoc: null }
    }

    const photos: Photo[] = snapshot.docs.map(doc => doc.data() as Photo)
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1]

    return { photos, lastDoc: newLastDoc }
  }

  return (
    <GalleryTemplate
      fetchPhotos={fetchPhotos}
      pageSize={PAGE_SIZE}
      imagePath={imagePath}
    />
  )
}

export default Gallery
