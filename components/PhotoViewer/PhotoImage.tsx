import React, { useEffect, useState } from 'react'
import styles from './PhotoViewer.module.scss'
import { Photo } from '@/types/Photo'

interface PhotoImageProps {
  photo: Photo
  isLoading: boolean
}

const PhotoImage = ({ photo, isLoading }: PhotoImageProps) => {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
    if (!photo.fullUrl) return
    const img: HTMLImageElement = new Image()
    img.src = photo.fullUrl
    img.onload = () => setLoaded(true)
  }, [photo])
  return (
    <img
      src={photo.fullUrl}
      alt={photo.title || 'Photo'}
      draggable={false}
      className={`${styles.photo} ${loaded ? styles.loaded : ''}`}
    />
  )
}

export default PhotoImage
