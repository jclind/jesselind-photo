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
  'image-failed': 'Error displaying photo.',
}

const PhotoLoader = ({ showLoader, error }: PhotoLoaderProps) => {
  if (!showLoader && !error) return null
  return (
    <>
      {showLoader && (
        <div role='status' aria-live='polite' className={styles.loadingMessage}>
          Loading...
        </div>
      )}
      {/* role='alert' carries an implicit assertive live region, so an error
          that lands after navigation is announced without waiting for a gap in
          screen reader output. */}
      {error && (
        <div role='alert' className={styles.errorMessage}>
          {ERROR_COPY[error]}
        </div>
      )}
    </>
  )
}

export default PhotoLoader
