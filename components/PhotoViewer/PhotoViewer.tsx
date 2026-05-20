'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getImageProps } from 'next/image'
import { preload } from 'react-dom'
import styles from './PhotoViewer.module.scss'
import PhotoLoader from './PhotoLoader'
import PhotoImage from './PhotoImage'
import PhotoControls from './PhotoControls'
import { usePhotoCollection } from '@/hooks/usePhotoCollection'
import InfoDisplay from './InfoDisplay'
import { PhotoViewerFilterType } from '@/types/Photo'

interface PageProps {
  params: { photoID: string }
  filter?: PhotoViewerFilterType
  path: string
}

// Distance threshold to commit a swipe (fraction of viewport width).
const SWIPE_COMMIT_FRACTION = 0.2
// Movement threshold to distinguish a swipe from a tap (px).
const SWIPE_TAP_THRESHOLD_PX = 8
// Duration of the commit / snap-back animation.
const SWIPE_ANIM_MS = 220

const PhotoViewerPage = ({ params, filter, path }: PageProps) => {
  const router = useRouter()
  const { photoID } = params

  const { photo, prevPhoto, nextPhoto, error, photoLoading } =
    usePhotoCollection({ initialPhotoID: photoID, filter })

  const [showLoader, setShowLoader] = useState(false)

  // Drag state. dragX is in pixels relative to the centered (rest) position.
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const isCommittingRef = useRef(false)
  const innerRef = useRef<HTMLDivElement>(null)
  const dragStartXRef = useRef(0)
  const dragStartYRef = useRef(0)
  const swipeAxisLockedRef = useRef<'x' | 'y' | null>(null)

  const prevBtnRef = useRef<HTMLButtonElement>(null)
  const nextBtnRef = useRef<HTMLButtonElement>(null)
  const lastDirectionRef = useRef<'prev' | 'next' | null>(null)

  useEffect(() => {
    if (!photoLoading) {
      setShowLoader(false)
      return
    }
    const timer = setTimeout(() => setShowLoader(true), 250)
    return () => clearTimeout(timer)
  }, [photoLoading])

  // Preload neighbor photos via the same /_next/image URL that <PhotoImage>
  // will request, so prev/next navigation hits the browser HTTP cache.
  useEffect(() => {
    for (const target of [prevPhoto, nextPhoto]) {
      if (!target?.fullUrl) continue
      const { props } = getImageProps({
        src: target.fullUrl,
        width: target.width,
        height: target.height,
        sizes: '100vw',
        alt: '',
      })
      preload(props.src, {
        as: 'image',
        imageSrcSet: props.srcSet,
        imageSizes: props.sizes,
      })
    }
  }, [prevPhoto, nextPhoto])

  const handleClickPrev = () => {
    if (!prevPhoto) return
    lastDirectionRef.current = 'prev'
    router.push(`${path}/${prevPhoto.id}`)
  }

  const handleClickNext = () => {
    if (!nextPhoto) return
    lastDirectionRef.current = 'next'
    router.push(`${path}/${nextPhoto.id}`)
  }

  useEffect(() => {
    const direction = lastDirectionRef.current
    if (!direction) return
    const target =
      direction === 'prev' ? prevBtnRef.current : nextBtnRef.current
    target?.focus()
    lastDirectionRef.current = null
  }, [photoID])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }
      if (e.key === 'ArrowLeft') handleClickPrev()
      else handleClickNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [prevPhoto, nextPhoto])

  // ---- Touch swipe handlers ----
  const onPointerDown = (e: React.PointerEvent) => {
    // Only react to touch; mouse users have the existing click zones and
    // footer buttons. Skip if a commit animation is already in flight.
    if (e.pointerType !== 'touch') return
    if (isCommittingRef.current) return
    dragStartXRef.current = e.clientX
    dragStartYRef.current = e.clientY
    swipeAxisLockedRef.current = null
    setIsDragging(true)
    setDragX(0)
    innerRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStartXRef.current
    const dy = e.clientY - dragStartYRef.current
    // Lock to an axis once we've moved enough to tell what the user meant.
    // If they're scrolling vertically, bail so the page can scroll normally.
    if (!swipeAxisLockedRef.current) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      swipeAxisLockedRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (swipeAxisLockedRef.current === 'y') {
        // Release the pointer so the browser can take over for scrolling.
        innerRef.current?.releasePointerCapture(e.pointerId)
        setIsDragging(false)
        return
      }
    }
    setDragX(dx)
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return
    setIsDragging(false)
    innerRef.current?.releasePointerCapture(e.pointerId)

    const width = innerRef.current?.offsetWidth || 1
    const delta = e.clientX - dragStartXRef.current
    const moved = Math.abs(delta) > SWIPE_TAP_THRESHOLD_PX
    const commitThreshold = width * SWIPE_COMMIT_FRACTION

    if (!moved) {
      // Treated as a tap; let the click event below handle navigation.
      setDragX(0)
      return
    }

    if (delta <= -commitThreshold && nextPhoto) {
      // Swipe left → next. Animate track off and navigate after the slide.
      isCommittingRef.current = true
      setDragX(-width)
      window.setTimeout(() => {
        handleClickNext()
      }, SWIPE_ANIM_MS)
    } else if (delta >= commitThreshold && prevPhoto) {
      isCommittingRef.current = true
      setDragX(width)
      window.setTimeout(() => {
        handleClickPrev()
      }, SWIPE_ANIM_MS)
    } else {
      // Below threshold or no neighbor in that direction; snap back.
      setDragX(0)
    }
  }

  // The track is keyed by photoID so it remounts after navigation. The new
  // mount starts at the rest position with no transition, and the new middle
  // pane shows the photo that was just sliding into view — so the visual
  // remains continuous across the route change.
  const trackTransform = `translateX(calc(-33.3333% + ${dragX}px))`
  const trackTransition = isDragging
    ? 'none'
    : `transform ${SWIPE_ANIM_MS}ms ease-out`

  return (
    <div className={styles.SinglePhoto}>
      <div className={styles.content}>
        <div
          className={styles.inner}
          id='photoContainer'
          ref={innerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <PhotoLoader showLoader={showLoader} error={error} />
          <div
            key={photoID}
            className={styles.swipeTrack}
            style={{ transform: trackTransform, transition: trackTransition }}
          >
            <div className={styles.swipePane} aria-hidden='true'>
              {prevPhoto && <PhotoImage photo={prevPhoto} />}
            </div>
            <div className={styles.swipePane}>
              {photo && <PhotoImage photo={photo} />}
            </div>
            <div className={styles.swipePane} aria-hidden='true'>
              {nextPhoto && <PhotoImage photo={nextPhoto} />}
            </div>
          </div>
          <button
            onClick={handleClickPrev}
            className={styles.prev_btn}
            aria-hidden='true'
            tabIndex={-1}
          ></button>
          <button
            onClick={handleClickNext}
            className={styles.next_btn}
            aria-hidden='true'
            tabIndex={-1}
          ></button>
        </div>

        <PhotoControls
          handleClickPrev={handleClickPrev}
          handleClickNext={handleClickNext}
          path={path}
          prevBtnRef={prevBtnRef}
          nextBtnRef={nextBtnRef}
        />

        <InfoDisplay photoInfo={photo} />
      </div>
    </div>
  )
}

export default PhotoViewerPage
