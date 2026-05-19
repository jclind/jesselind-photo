import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import styles from './PhotoViewer.module.scss'
import { Photo } from '@/types/Photo'

interface PhotoImageProps {
  photo: Photo
}

// generateBlurPlaceholder always returns `data:image/jpeg;base64,<base64>`.
// Anything else in this field is a forged doc — drop it before it reaches the
// CSS url() string and can break out of the quoted context.
const VALID_BLUR = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/

const PhotoImage = ({ photo }: PhotoImageProps) => {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
  }, [photo.id])

  if (!photo.fullUrl) return null

  const safeBlur =
    photo.blurDataURL && VALID_BLUR.test(photo.blurDataURL)
      ? photo.blurDataURL
      : null

  return (
    <div
      className={styles.photoFrame}
      style={{
        aspectRatio: `${photo.width} / ${photo.height}`,
        ...(safeBlur && {
          backgroundImage: `url("${safeBlur}")`,
        }),
      }}
    >
      <Image
        src={photo.fullUrl}
        alt={photo.title || 'Photo'}
        width={photo.width}
        height={photo.height}
        draggable={false}
        priority
        sizes='100vw'
        onLoad={() => setLoaded(true)}
        className={`${styles.photo} ${loaded ? styles.loaded : ''}`}
      />
    </div>
  )
}

export default PhotoImage
