'use client'

import React, { useState } from 'react'
import styles from './GalleryTemplate.module.scss'
import { Photo } from '@/types/Photo'
import Link from 'next/link'

export default function PhotoThumbnail({
  photo,
  isThumbnailMode,
  createFullImagePath,
}: {
  photo: Photo
  isThumbnailMode: boolean
  createFullImagePath: (photo: Photo) => string
}) {
  const [fullLoaded, setFullLoaded] = useState(false)

  return (
    <Link
      href={createFullImagePath(photo)}
      className={styles.card}
      key={photo.id}
      onMouseEnter={() => {
        if (photo.fullUrl) {
          const img = new Image()
          img.src = photo.fullUrl
        }
      }}
    >
      {isThumbnailMode ? <h1>{photo.id}.webp</h1> : ''}
      <img
        className={`${styles.fullImage} ${fullLoaded ? styles.loaded : ''}`}
        src={isThumbnailMode ? photo.thumbnailUrl : photo.fullUrl}
        alt={photo.title}
        loading='lazy'
        onLoad={() => setFullLoaded(true)}
        height={photo.height}
        width={photo.width}
      />
    </Link>
  )
}
