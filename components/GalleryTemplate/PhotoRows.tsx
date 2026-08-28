'use client'

import React, { useMemo, useSyncExternalStore } from 'react'

import styles from './GalleryTemplate.module.scss'
import { Photo, PhotoRowsType } from '@/types/Photo'
import Link from 'next/link'
import Image from 'next/image'
import { getAspectRatioFromPhoto } from '@/util/photoDimentionFns'
import { getPhotoAlt } from '@/util/getPhotoAlt'

// Pack photos into rows, growing a row until it is short enough to keep.
const calculatePhotosRows = (
  originalPhotos: Photo[],
  pageW: number,
  pageH: number
) => {
  const MAX_ROW_HEIGHT = Math.min(700, pageH)
  const PREFERRED_ROW_HEIGHT = 600

  const photoRows: PhotoRowsType[] = []
  let currRowIndex = 0
  originalPhotos.forEach(photo => {
    const currR = getAspectRatioFromPhoto(photo)
    let rowHeight = 0

    if (currRowIndex >= photoRows.length) {
      rowHeight = pageW / currR
      photoRows.push({
        rowPhotos: [photo],
        height: rowHeight > MAX_ROW_HEIGHT ? PREFERRED_ROW_HEIGHT : rowHeight,
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

// Row heights depend on the viewport, which React can only read on the client.
// The snapshot is a string so repeat reads of an unchanged size compare equal.
//
// Resize can fire many times per frame, and each notification repacks every row
// and re-renders the whole gallery. Coalescing to one rAF caps that at once per
// frame while still tracking the window as it is dragged.
const subscribeToViewport = (onChange: () => void) => {
  let frame = 0
  const onResize = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      onChange()
    })
  }
  window.addEventListener('resize', onResize)
  return () => {
    if (frame) cancelAnimationFrame(frame)
    window.removeEventListener('resize', onResize)
  }
}
const getViewportSnapshot = () => `${window.innerWidth}x${window.innerHeight}`
const getServerViewportSnapshot = () => null

const PhotoRows = ({
  photos,
  createFullImagePath,
}: {
  photos: Photo[]
  createFullImagePath: (photo: Photo) => string
}) => {
  const viewport = useSyncExternalStore(
    subscribeToViewport,
    getViewportSnapshot,
    getServerViewportSnapshot
  )

  const formattedPhotos = useMemo(() => {
    if (!viewport || photos.length === 0) return []
    const [pageW, pageH] = viewport.split('x').map(Number)
    return calculatePhotosRows(photos, pageW, pageH)
  }, [photos, viewport])

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
                      alt={getPhotoAlt(photo)}
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
