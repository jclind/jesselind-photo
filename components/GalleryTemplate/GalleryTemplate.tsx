'use client'

import React, { useCallback, useEffect, useState } from 'react'
import styles from './GalleryTemplate.module.scss'
import { LayoutGrid, PanelsTopLeft } from 'lucide-react'
import type { QueryDocumentSnapshot } from 'firebase/firestore'
import PhotoThumbnail from './PhotoThumbnail'
import PhotoRows from './PhotoRows'
import { Photo } from '@/types/Photo'

type GalleryProps = {
  fetchPhotos: (
    lastDoc?: QueryDocumentSnapshot
  ) => Promise<{ photos: Photo[]; lastDoc: QueryDocumentSnapshot | null }>
  pageSize?: number
  imagePath: string
  topGapSmall?: boolean
}

const GalleryTemplate = ({
  fetchPhotos,
  pageSize = 10,
  imagePath,
  topGapSmall,
}: GalleryProps) => {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [isThumbnailMode, setIsThumbnailMode] = useState(true)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const { photos: newPhotos, lastDoc: newLastDoc } = await fetchPhotos(
        lastDoc ?? undefined
      )
      setPhotos(prev => [...prev, ...newPhotos])
      setLastDoc(newLastDoc)
      if (!newLastDoc) setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [fetchPhotos, lastDoc, loading, hasMore])

  useEffect(() => {
    loadMore()
  }, [])

  // infinite scroll
  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 1000 &&
        !loading &&
        hasMore
      ) {
        loadMore()
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [loadMore, loading, hasMore])

  const handleModeToggle = () => {
    window.scrollTo(0, 0)
    setIsThumbnailMode(prev => !prev)
  }

  const createFullImagePath = (photo: Photo): string => {
    return `${imagePath}/${photo.id}`
  }

  return (
    <div
      className={`${styles.Gallery} ${
        isThumbnailMode ? styles.thumbnail_mode : styles.full_img_mode
      }`}
    >
      <button
        className={styles.toggle_mode_btn}
        onClick={handleModeToggle}
        aria-label='Toggle view mode'
      >
        {isThumbnailMode ? <LayoutGrid /> : <PanelsTopLeft />}
      </button>
      <div
        className={`${styles.content} ${topGapSmall ? styles.topGapSmall : ''}`}
      >
        <div className={styles.grid}>
          {isThumbnailMode ? (
            photos.map((photo: Photo) => (
              <PhotoThumbnail
                key={photo.id}
                photo={photo}
                isThumbnailMode={isThumbnailMode}
                createFullImagePath={createFullImagePath}
              />
            ))
          ) : (
            <PhotoRows
              photos={photos}
              createFullImagePath={createFullImagePath}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default GalleryTemplate
