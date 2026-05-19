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

const PhotoViewerPage = ({ params, filter, path }: PageProps) => {
  const router = useRouter()
  const { photoID } = params

  const { photo, prevPhoto, nextPhoto, error, photoLoading } =
    usePhotoCollection({ initialPhotoID: photoID, filter })

  const [showLoader, setShowLoader] = useState(false)

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

  return (
    <div className={styles.SinglePhoto}>
      <div className={styles.content}>
        <div className={styles.inner} id='photoContainer'>
          <PhotoLoader showLoader={showLoader} error={error} />
          {photo && <PhotoImage photo={photo} />}
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
