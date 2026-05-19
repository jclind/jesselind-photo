'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import styles from './GalleryTemplate.module.scss'
import { LayoutGrid, PanelsTopLeft } from 'lucide-react'
import type { QueryDocumentSnapshot } from 'firebase/firestore/lite'
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
  title?: string
}

const GalleryTemplate = ({
  fetchPhotos,
  pageSize = 10,
  imagePath,
  topGapSmall,
  title,
}: GalleryProps) => {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [isThumbnailMode, setIsThumbnailMode] = useState(true)
  const [liveMessage, setLiveMessage] = useState('')
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const { photos: newPhotos, lastDoc: newLastDoc } = await fetchPhotos(
        lastDoc ?? undefined
      )
      setPhotos(prev => {
        const next = [...prev, ...newPhotos]
        if (newPhotos.length > 0) {
          setLiveMessage(
            `Loaded ${newPhotos.length} more photo${
              newPhotos.length === 1 ? '' : 's'
            }. Total ${next.length}.`
          )
        }
        return next
      })
      setLastDoc(newLastDoc)
      if (!newLastDoc) setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [fetchPhotos, lastDoc, loading, hasMore])

  useEffect(() => {
    loadMore()
  }, [])

  // infinite scroll via IntersectionObserver on a sentinel below the grid
  useEffect(() => {
    if (!hasMore) return
    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && !loading && hasMore) {
          loadMore()
        }
      },
      { rootMargin: '1000px 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
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
        aria-pressed={isThumbnailMode}
      >
        {isThumbnailMode ? <LayoutGrid /> : <PanelsTopLeft />}
      </button>
      {title && <h1 className={styles.title}>{title}</h1>}
      <div
        className={`${styles.content} ${topGapSmall ? styles.topGapSmall : ''}`}
      >
        {isThumbnailMode ? (
          <ul role='list' className={styles.grid}>
            {photos.map((photo: Photo) => (
              <li key={photo.id}>
                <PhotoThumbnail
                  photo={photo}
                  isThumbnailMode={isThumbnailMode}
                  createFullImagePath={createFullImagePath}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.grid}>
            <PhotoRows
              photos={photos}
              createFullImagePath={createFullImagePath}
            />
          </div>
        )}
        <div role='status' aria-live='polite' className='visually-hidden'>
          {liveMessage}
        </div>
        {hasMore && <div ref={sentinelRef} aria-hidden />}
      </div>
    </div>
  )
}

export default GalleryTemplate
