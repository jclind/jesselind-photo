'use client'

import React from 'react'
import {
  collection,
  query,
  orderBy,
  startAfter,
  limit,
  getDocs,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Photo } from '@/types/Photo'
import GalleryTemplate from '@/components/GalleryTemplate'
import { categories } from '@/data/categories'
import { useParams } from 'next/navigation'

const PAGE_SIZE = 20

const CollectionGallery = () => {
  const { collectionID } = useParams<{ collectionID: string }>()
  const category = categories.find(cat => cat.name === collectionID)

  const imagePath = `/collections/${collectionID}`

  if (!category) {
    return <div>Collection not found</div>
  }

  const fetchPhotos = async (lastDoc?: QueryDocumentSnapshot) => {
    const photosRef = collection(db, 'photos')
    // Create the query filtered by category
    const q = lastDoc
      ? query(
          photosRef,
          where('category', '==', collectionID),
          orderBy('sequenceNumber', 'desc'),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        )
      : query(
          photosRef,
          where('category', '==', collectionID),
          orderBy('sequenceNumber', 'desc'),
          limit(PAGE_SIZE)
        )

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

export default CollectionGallery
