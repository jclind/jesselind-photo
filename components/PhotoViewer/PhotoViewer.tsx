'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
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

const PhotoViewerPage = ({ params, filter, path }: PageProps) => {
  const router = useRouter()
  const { photoID } = params

  const { photo, prevPhoto, nextPhoto, error, photoLoading } =
    usePhotoCollection({ initialPhotoID: photoID, filter })

  // Which load has been running long enough to earn a loader. Keyed to the
  // individual load rather than the photo, and reset during render when a new
  // one starts, so a photo that was slow once doesn't skip the 250ms wait the
  // next time round.
  const loadKey = `${photoID}|${photoLoading}`
  const [loader, setLoader] = useState({ key: loadKey, slow: false })
  if (loader.key !== loadKey) {
    setLoader({ key: loadKey, slow: false })
  }
  const showLoader = photoLoading && loader.key === loadKey && loader.slow
  // The photo whose image request failed. Keyed by id rather than a boolean so
  // navigating away clears it without an effect.
  const [failedPhotoID, setFailedPhotoID] = useState<string | null>(null)
  // A doc with no fullUrl has nothing to request in the first place. Same blank
  // frame as a failed request, so it gets the same message.
  const imageFailed = !!photo && (!photo.fullUrl || failedPhotoID === photo.id)

  const prevBtnRef = useRef<HTMLButtonElement>(null)
  const nextBtnRef = useRef<HTMLButtonElement>(null)
  const lastDirectionRef = useRef<'prev' | 'next' | null>(null)

  useEffect(() => {
    if (!photoLoading) return
    const timer = setTimeout(() => setLoader({ key: loadKey, slow: true }), 250)
    return () => clearTimeout(timer)
  }, [photoLoading, loadKey])

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

  // Memoized so the keydown effect below can depend on them by identity
  // instead of restating their closure in its own dep array.
  const handleClickPrev = useCallback(() => {
    if (!prevPhoto) return
    lastDirectionRef.current = 'prev'
    router.push(`${path}/${prevPhoto.id}`)
  }, [prevPhoto, router, path])

  const handleClickNext = useCallback(() => {
    if (!nextPhoto) return
    lastDirectionRef.current = 'next'
    router.push(`${path}/${nextPhoto.id}`)
  }, [nextPhoto, router, path])

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
  }, [handleClickPrev, handleClickNext])

  return (
    <div className={styles.SinglePhoto}>
      <div className={styles.content}>
        <div className={styles.inner} id='photoContainer'>
          <PhotoLoader
            showLoader={showLoader}
            error={error ?? (imageFailed ? 'image-failed' : null)}
          />
          {photo && !imageFailed && (
            <PhotoImage photo={photo} onError={setFailedPhotoID} />
          )}
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
