import React from 'react'
import styles from './PhotoViewer.module.scss'
import { PhotoLoadError } from '@/types/Photo'

interface PhotoLoaderProps {
  showLoader: boolean
  error: PhotoLoadError | null
}

const ERROR_COPY: Record<PhotoLoadError, string> = {
  'not-found': 'Photo not found.',
  'fetch-failed': 'Error loading photo.',
}

const PhotoLoader = ({ showLoader, error }: PhotoLoaderProps) => {
  if (!showLoader && !error) return null
  return (
    <>
      {showLoader && <div className={styles.spinner}>Loading...</div>}
      {error && <div className={styles.errorMessage}>{ERROR_COPY[error]}</div>}
    </>
  )
}

export default PhotoLoader
