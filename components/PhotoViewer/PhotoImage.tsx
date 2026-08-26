import React, { useCallback, useState } from 'react'
import Image from 'next/image'
import styles from './PhotoViewer.module.scss'
import { Photo } from '@/types/Photo'
import { getPhotoAlt } from '@/util/getPhotoAlt'

interface PhotoImageProps {
  photo: Photo
}

// generateBlurPlaceholder always returns `data:image/jpeg;base64,<base64>`.
// Anything else in this field is a forged doc — drop it before it reaches the
// CSS url() string and can break out of the quoted context.
const VALID_BLUR = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/

const PhotoImage = ({ photo }: PhotoImageProps) => {
  const photoId = photo.id
  // Which photo the reveal belongs to, so a load that resolves after the
  // viewer moved on cannot un-hide the wrong image.
  const [loadedId, setLoadedId] = useState<string | null>(null)
  const loaded = loadedId === photoId

  // Don't reveal via next/image's onLoad. It fires that from an img.decode()
  // continuation, gated on a one-shot `data-loaded-src` stamp it writes before
  // awaiting. PhotoViewer preloads both neighbors, so on navigation the new
  // element is often already decoded before React connects it; the
  // continuation then hits its own isConnected guard and returns, the stamp
  // blocks any retry, and onLoad never arrives. The photo stays at opacity 0
  // with only the blur showing until a reload. Read the element instead.
  const revealRef = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img) return
      if (img.complete && img.naturalWidth > 0) {
        setLoadedId(photoId)
        return
      }
      const reveal = () => setLoadedId(photoId)
      img.addEventListener('load', reveal)
      return () => img.removeEventListener('load', reveal)
    },
    [photoId]
  )

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
        key={photoId}
        ref={revealRef}
        src={photo.fullUrl}
        alt={getPhotoAlt(photo)}
        width={photo.width}
        height={photo.height}
        draggable={false}
        priority
        sizes='100vw'
        className={`${styles.photo} ${loaded ? styles.loaded : ''}`}
      />
    </div>
  )
}

export default PhotoImage
