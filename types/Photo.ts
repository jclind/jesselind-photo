import { Timestamp } from 'firebase/firestore/lite'

export interface Photo {
  id: string
  title: string
  category?: string
  projectID?: string
  description?: string
  thumbnailUrl?: string
  thumbnailPath?: string
  fullUrl?: string
  photoDate: Timestamp
  storagePath?: string
  location?: string
  height: number
  width: number
  sequenceNumber: number
  blurDataURL?: string
}

export type PhotoRowsType = {
  rowPhotos: Photo[]
  height: number
}

export type PhotoViewerFilterType = {
  field: 'category' | 'projectID'
  value: string
}

export type PhotoLoadError = 'not-found' | 'fetch-failed'
