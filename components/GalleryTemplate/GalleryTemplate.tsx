'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import styles from './GalleryTemplate.module.scss'
import { LayoutGrid, PanelsTopLeft } from 'lucide-react'
import type { QueryDocumentSnapshot } from 'firebase/firestore/lite'
import PhotoThumbnail from './PhotoThumbnail'
import PhotoRows from './PhotoRows'
import { Photo } from '@/types/Photo'
import { useGalleryStore, type GalleryEntry } from '@/store/galleryStore'

type GalleryProps = {
  fetchPhotos: (
    lastDoc?: QueryDocumentSnapshot
  ) => Promise<{ photos: Photo[]; lastDoc: QueryDocumentSnapshot | null }>
  pageSize?: number
  imagePath: string
  topGapSmall?: boolean
  title?: string
}

// Decide on mount whether to rehydrate from the gallery store. We look at the
// pathname currently recorded in the store — child effects run before
// NavigationTracker's parent effect, so on mount this still holds the path we
// navigated *from*. We restore if that path was either the matching viewer
// route or the gallery itself (the latter covers Strict Mode remounts).
function readInitialEntry(imagePath: string): GalleryEntry | undefined {
  const { currentPath, entries } = useGalleryStore.getState()
  if (!currentPath) return undefined
  const fromMatchingViewer = currentPath.startsWith(`${imagePath}/`)
  const fromSelf = currentPath === imagePath
  return fromMatchingViewer || fromSelf ? entries[imagePath] : undefined
}

const GalleryTemplate = ({
  fetchPhotos,
  pageSize = 10,
  imagePath,
  topGapSmall,
  title,
}: GalleryProps) => {
  const initialEntryRef = useRef<GalleryEntry | undefined>(undefined)
  if (initialEntryRef.current === undefined) {
    initialEntryRef.current = readInitialEntry(imagePath)
  }
  const initial = initialEntryRef.current

  const [photos, setPhotos] = useState<Photo[]>(initial?.photos ?? [])
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(
    initial?.lastDoc ?? null
  )
  const [hasMore, setHasMore] = useState(initial?.hasMore ?? true)
  const [loading, setLoading] = useState(false)
  const [isThumbnailMode, setIsThumbnailMode] = useState(
    initial?.isThumbnailMode ?? true
  )
  const [liveMessage, setLiveMessage] = useState('')
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const fetchingRef = useRef(false)
  const initialFetchDoneRef = useRef(!!initial)

  // On mount: either restore scroll (returning from the viewer) or clear any
  // stale entry left over from an earlier visit.
  useEffect(() => {
    if (initial) {
      const y = initial.scrollY
      requestAnimationFrame(() => window.scrollTo(0, y))
    } else {
      useGalleryStore.getState().clearEntry(imagePath)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return
    fetchingRef.current = true
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
      fetchingRef.current = false
    }
  }, [fetchPhotos, lastDoc, hasMore])

  useEffect(() => {
    if (initialFetchDoneRef.current) return
    initialFetchDoneRef.current = true
    loadMore()
  }, [loadMore])

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

  // Persist state to the store whenever it changes so that returning from the
  // viewer can rehydrate. scrollY is intentionally a snapshot at the time of
  // each save; we also update it on unmount below.
  useEffect(() => {
    useGalleryStore.getState().setEntry(imagePath, {
      photos,
      lastDoc,
      hasMore,
      scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
      isThumbnailMode,
    })
  }, [photos, lastDoc, hasMore, isThumbnailMode, imagePath])

  // Capture scrollY on unmount — the user's scroll between state changes isn't
  // otherwise reflected in the persisted entry.
  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return
      useGalleryStore
        .getState()
        .patchEntry(imagePath, { scrollY: window.scrollY })
    }
  }, [imagePath])

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
