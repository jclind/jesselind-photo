import React from 'react'
import styles from './PhotoViewer.module.scss'

interface PhotoLoaderProps {
  showLoader: boolean
  timeoutMessage: string
}

const PhotoLoader = ({ showLoader, timeoutMessage }: PhotoLoaderProps) => {
  if (!showLoader && !timeoutMessage) return null
  return (
    <>
      {showLoader && <div className={styles.spinner}>Loading...</div>}
      {timeoutMessage && (
        <div className={styles.errorMessage}>{timeoutMessage}</div>
      )}
    </>
  )
}

export default PhotoLoader
