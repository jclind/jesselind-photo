'use client'

import React, { useEffect, useState } from 'react'

import styles from './GalleryTemplate.module.scss'
import { Photo, PhotoRowsType } from '@/types/Photo'
import Link from 'next/link'
import Image from 'next/image'
import { getAspectRatioFromPhoto } from '@/util/photoDimentionFns'

const PhotoRows = ({
  photos,
  createFullImagePath,
}: {
  photos: Photo[]
  createFullImagePath: (photo: Photo) => string
}) => {
  const [formattedPhotos, setFormattedPhotos] = useState<PhotoRowsType[]>([])

  useEffect(() => {
    // Function to calculate the optimal height and number of photos to place in gallery row
    const calculatePhotosRows = (originalPhotos: Photo[]) => {
      const pageHeight = window.innerHeight
      const MAX_ROW_HEIGHT = Math.min(700, pageHeight)
      const PREFERRED_ROW_HEIGHT = 600

      const photoRows: { rowPhotos: Photo[]; height: number }[] = []
      let currRowIndex = 0
      originalPhotos.forEach(photo => {
        const currR = getAspectRatioFromPhoto(photo)
        const pageW = window.innerWidth
        let rowHeight = 0

        if (currRowIndex >= photoRows.length) {
          rowHeight = pageW / currR
          photoRows.push({
            rowPhotos: [photo],
            height:
              rowHeight > MAX_ROW_HEIGHT ? PREFERRED_ROW_HEIGHT : rowHeight,
          })
        } else {
          const newRowPhotos = [...photoRows[currRowIndex].rowPhotos, photo]
          const currRowRatioSum = newRowPhotos.reduce(
            (sum, rowPhoto) => sum + getAspectRatioFromPhoto(rowPhoto),
            0
          )
          rowHeight = pageW / currRowRatioSum

          photoRows[currRowIndex] = {
            rowPhotos: newRowPhotos,
            height: rowHeight,
          }
        }

        if (rowHeight <= MAX_ROW_HEIGHT) {
          currRowIndex++
        }
      })

      return photoRows
    }

    const newPhotos = photos.length > 0 ? calculatePhotosRows(photos) : []
    setFormattedPhotos(newPhotos)
  }, [photos])
  if (formattedPhotos.length <= 0) return null

  return (
    <div className={styles.photos_row}>
      {formattedPhotos.map((row, index) => {
        return (
          <div
            className={styles.row}
            style={{ height: row.height }}
            key={index}
          >
            {row.rowPhotos.map(photo => {
              const r = getAspectRatioFromPhoto(photo)
              const h = row.height
              const w = h * r

              return (
                <Link
                  href={createFullImagePath(photo)}
                  key={photo.id}
                  onMouseEnter={() => {
                    if (photo.fullUrl) {
                      const img = new window.Image()
                      img.src = photo.fullUrl
                    }
                  }}
                >
                  {photo.fullUrl && (
                    <Image
                      src={photo.fullUrl}
                      alt={photo.title || ''}
                      width={Math.round(w)}
                      height={Math.round(h)}
                      sizes='(max-width: 768px) 100vw, 60vw'
                    />
                  )}
                </Link>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export default PhotoRows
