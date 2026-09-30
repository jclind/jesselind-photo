import type { PhotoUploadStatus } from '@/util/uploadPhotos'

// One picked file plus its editable metadata. key is a stable id independent
// of the file's position in the batch.
export type BatchItem = {
  key: string
  file: File
  // Object URL of a small generated JPEG, or null while it is being made.
  // Falls back to the file's own URL if generation fails.
  previewUrl: string | null
  captureMs: number | null
  // Set once a date is applied by hand, so a late EXIF read cannot replace it
  dateEdited: boolean
  location: string
  category: string
  title: string
  description: string
  // Matches an existing upload in the chosen project, so it is excluded
  alreadyUploaded: boolean
  status: ItemStatus
  // docId of the last failed attempt, kept apart from status so a later run
  // that resets status cannot lose it. Cleared once the photo is done.
  retryDocId: string | null
}

export type ItemStatus = { state: 'ready' } | PhotoUploadStatus

export type ApplyPatch = Partial<
  Pick<
    BatchItem,
    'location' | 'category' | 'title' | 'description' | 'captureMs'
  >
>

export type DayGroup = {
  key: string
  label: string
  items: BatchItem[]
}
