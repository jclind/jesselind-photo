'use client'

import React, { useState } from 'react'
import styles from './PhotoViewer.module.scss'
import { Info, X } from 'lucide-react'
import { Photo } from '@/types/Photo'
import { timestampToMMDDYYYY } from '@/util/dateFns'

type InfoDisplayProps = { photoInfo: Photo | null }

const InfoDisplay = ({ photoInfo }: InfoDisplayProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        className={`${styles.info_btn} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label='Toggle photo information'
      >
        {isOpen ? (
          <X size={20} strokeWidth={1.2} color='white' />
        ) : (
          <Info size={20} strokeWidth={1.2} />
        )}
      </button>
      <div
        className={`${styles.info_container} ${
          isOpen ? styles.open : styles.closed
        }`}
      >
        <div className={styles.background}></div>
        {photoInfo ? (
          <div className={styles.text_container}>
            <div className={styles.text}>
              <span>Photo ID:</span>
              {photoInfo.id}
            </div>
            {photoInfo.location && (
              <div className={styles.text}>
                <span>Location:</span> {photoInfo.location}
              </div>
            )}
            {photoInfo.photoDate && (
              <div className={styles.text}>
                <span>Taken:</span> {timestampToMMDDYYYY(photoInfo.photoDate)}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  )
}

export default InfoDisplay
