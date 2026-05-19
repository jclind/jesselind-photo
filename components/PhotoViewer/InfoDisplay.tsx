'use client'

import React, { useEffect, useState } from 'react'
import styles from './PhotoViewer.module.scss'
import { Info, X } from 'lucide-react'
import { Photo } from '@/types/Photo'
import { timestampToMMDDYYYY } from '@/util/dateFns'

type InfoDisplayProps = { photoInfo: Photo | null }

const PANEL_ID = 'photo-info-panel'

const InfoDisplay = ({ photoInfo }: InfoDisplayProps) => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <>
      <button
        className={styles.info_btn}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={isOpen ? 'Hide photo information' : 'Show photo information'}
        aria-expanded={isOpen}
        aria-controls={PANEL_ID}
      >
        {isOpen ? (
          <X size={20} strokeWidth={1.2} />
        ) : (
          <Info size={20} strokeWidth={1.2} />
        )}
      </button>
      {photoInfo && (
        <div id={PANEL_ID} className={styles.info_panel} hidden={!isOpen}>
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
      )}
    </>
  )
}

export default InfoDisplay
