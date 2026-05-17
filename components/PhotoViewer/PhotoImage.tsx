import React, { useEffect, useState } from 'react'
import styles from './PhotoViewer.module.scss'
import { Photo } from '@/types/Photo'
import { usePhotoStore } from '@/store/photoStore'

interface PhotoImageProps {
  photo: Photo
  isLoading: boolean
}

const PhotoImage = ({ photo, isLoading }: PhotoImageProps) => {
  const cached = usePhotoStore(state => state.cache[photo.id])
  const [loaded, setLoaded] = useState(Boolean(cached?.preloadedUrl))

  useEffect(() => {
    if (cached?.preloadedUrl) {
      setLoaded(true)
      return
    }
    setLoaded(false)
    if (!photo.fullUrl) return
    const img: HTMLImageElement = new Image()
    img.src = photo.fullUrl
    img.onload = () => setLoaded(true)
  }, [photo, cached])

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
