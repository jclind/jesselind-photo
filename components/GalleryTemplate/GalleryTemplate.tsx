'use client'

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import styles from './GalleryTemplate.module.scss'
import { LayoutGrid, PanelsTopLeft } from 'lucide-react'
import type { QueryDocumentSnapshot } from 'firebase/firestore/lite'
import PhotoThumbnail from './PhotoThumbnail'
import PhotoRows from './PhotoRows'
import { Photo } from '@/types/Photo'
import { useGalleryStore, type GalleryEntry } from '@/store/galleryStore'
import { usePathname } from 'next/navigation'

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
  const pathname = usePathname()
  const lastRestoredPathRef = useRef<string | null>(null)

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

  // Restore scroll synchronously before paint so we beat Next.js's default
  // scroll-to-top, which runs in a post-paint effect inside the App Router's
  // ScrollAndFocusHandler. A backup rAF in the next effect re-asserts if any
  // later handler clobbers our position.
  useLayoutEffect(() => {
    if (!initial) {
      useGalleryStore.getState().clearEntry(imagePath)
      return
    }
    if (initial.scrollY > 0) {
      window.scrollTo(0, initial.scrollY)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Defensive re-assertion for up to ~500ms. If something post-paint scrolls
  // us back toward 0, we re-apply the saved position. We stop early when the
  // user provides scroll input so we don't fight legitimate scrolling.
  useEffect(() => {
    if (!initial || initial.scrollY <= 0) return
    const targetY = initial.scrollY
    const startTime = performance.now()
    let cancelled = false
    let userScrolled = false

    const onUserInput = () => {
      userScrolled = true
    }
    window.addEventListener('wheel', onUserInput, { passive: true })
    window.addEventListener('touchstart', onUserInput, { passive: true })
    window.addEventListener('keydown', onUserInput)

    const tick = () => {
      if (cancelled || userScrolled) return
      const elapsed = performance.now() - startTime
      if (elapsed >= 500) return
      if (Math.abs(window.scrollY - targetY) > 8) {
        window.scrollTo(0, targetY)
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    return () => {
      cancelled = true
      window.removeEventListener('wheel', onUserInput)
      window.removeEventListener('touchstart', onUserInput)
      window.removeEventListener('keydown', onUserInput)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-trigger restoration on pathname transitions back to this gallery's
  // path. Covers the case where Next.js's router cache reuses the gallery
  // instance (no remount → useLayoutEffect doesn't fire). We compare against
  // the last path we restored at to avoid re-restoring on every render.
  useEffect(() => {
    if (pathname !== imagePath) return
    if (lastRestoredPathRef.current === pathname) return
    lastRestoredPathRef.current = pathname

    const entry = useGalleryStore.getState().entries[imagePath]
    if (!entry || entry.scrollY <= 0) return
    const targetY = entry.scrollY

    const startTime = performance.now()
    let cancelled = false
    let userScrolled = false
    const onUserInput = () => {
      userScrolled = true
    }
    window.addEventListener('wheel', onUserInput, { passive: true })
    window.addEventListener('touchstart', onUserInput, { passive: true })
    window.addEventListener('keydown', onUserInput)

    window.scrollTo(0, targetY)
    const tick = () => {
      if (cancelled || userScrolled) return
      const elapsed = performance.now() - startTime
      if (elapsed >= 500) return
      if (Math.abs(window.scrollY - targetY) > 8) {
        window.scrollTo(0, targetY)
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    return () => {
      cancelled = true
      window.removeEventListener('wheel', onUserInput)
      window.removeEventListener('touchstart', onUserInput)
      window.removeEventListener('keydown', onUserInput)
    }
  }, [pathname, imagePath])

  // Track scrollY into the store synchronously on every scroll event.
  //
  // We deliberately do NOT throttle via rAF, and we deliberately do NOT touch
  // the store in the cleanup. The reason: when navigating from the gallery
  // (tall body) to the viewer (viewport-height body), the browser clamps
  // window.scrollY to 0 as soon as the DOM shrinks — which happens before our
  // React unmount cleanup runs. A cleanup that reads window.scrollY would
  // therefore capture 0 and clobber the real saved position. The scroll
  // listener, in contrast, fires with the true value during scrolling, so by
  // the time the user clicks a thumbnail the store already holds the right Y.
  useEffect(() => {
    let lastWritten = 0
    const onScroll = () => {
      const newY = window.scrollY
      // Filter the browser's auto-clamp-to-0 scroll event that fires during
      // route transitions when the body shrinks. A single event jumping from
      // a high value straight to 0 is the clamp, not a user scroll — real
      // scroll events deliver small deltas per frame.
      if (newY === 0 && lastWritten > 100) return
      lastWritten = newY
      useGalleryStore.getState().patchEntry(imagePath, { scrollY: newY })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [imagePath])

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

  // Persist photos/paging/view-mode on changes. scrollY is owned by the scroll
  // listener above; preserve whatever value the listener has already written.
  useEffect(() => {
    const existing = useGalleryStore.getState().entries[imagePath]
    useGalleryStore.getState().setEntry(imagePath, {
      photos,
      lastDoc,
      hasMore,
      scrollY:
        existing?.scrollY ??
        (typeof window !== 'undefined' ? window.scrollY : 0),
      isThumbnailMode,
    })
  }, [photos, lastDoc, hasMore, isThumbnailMode, imagePath])

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
