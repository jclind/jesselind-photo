'use client'

import React, { useState } from 'react'
import styles from './GalleryTemplate.module.scss'
import { Photo } from '@/types/Photo'
import Link from 'next/link'
import Image from 'next/image'

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
  const src = isThumbnailMode ? photo.thumbnailUrl : photo.fullUrl

  return (
    <Link
      href={createFullImagePath(photo)}
      className={styles.card}
      key={photo.id}
      onMouseEnter={() => {
        if (photo.fullUrl) {
          const img = new window.Image()
          img.src = photo.fullUrl
        }
      }}
    >
      {isThumbnailMode ? <h1>{photo.id}.webp</h1> : ''}
      {src && (
        <Image
          className={`${styles.fullImage} ${fullLoaded ? styles.loaded : ''}`}
          src={src}
          alt={photo.title}
          loading='lazy'
          onLoad={() => setFullLoaded(true)}
          width={photo.width}
          height={photo.height}
          sizes='(max-width: 576px) 50vw, (max-width: 768px) 33vw, (max-width: 992px) 25vw, 200px'
          placeholder={photo.blurDataURL ? 'blur' : 'empty'}
          blurDataURL={photo.blurDataURL}
        />
      )}
    </Link>
  )
}
