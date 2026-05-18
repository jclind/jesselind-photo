import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import styles from './PhotoViewer.module.scss'
import { Photo } from '@/types/Photo'

interface PhotoImageProps {
  photo: Photo
}

const PhotoImage = ({ photo }: PhotoImageProps) => {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
  }, [photo.id])

  if (!photo.fullUrl) return null

  return (
    <div
      className={styles.photoFrame}
      style={{
        aspectRatio: `${photo.width} / ${photo.height}`,
        ...(photo.blurDataURL && {
          backgroundImage: `url("${photo.blurDataURL}")`,
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
