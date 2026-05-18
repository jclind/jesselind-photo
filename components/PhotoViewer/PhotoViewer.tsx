'use client'

import React, { useEffect, useState } from 'react'
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
    router.push(`${path}/${prevPhoto.id}`)
  }

  const handleClickNext = () => {
    if (!nextPhoto) return
    router.push(`${path}/${nextPhoto.id}`)
  }

  return (
    <div className={styles.SinglePhoto}>
      <div className={styles.content}>
        <div className={styles.inner} id='photoContainer'>
          <PhotoLoader showLoader={showLoader} error={error} />
          {photo && <PhotoImage photo={photo} />}
          <button
            onClick={handleClickPrev}
            className={styles.prev_btn}
            aria-label='Previous photo'
          ></button>
          <button
            onClick={handleClickNext}
            className={styles.next_btn}
            aria-label='Next photo'
          ></button>
        </div>

        <PhotoControls
          handleClickPrev={handleClickPrev}
          handleClickNext={handleClickNext}
          path={path}
        />

        <InfoDisplay photoInfo={photo} />
      </div>
    </div>
  )
}

export default PhotoViewerPage
