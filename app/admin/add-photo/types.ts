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
  location: string
  category: string
  title: string
  description: string
  // Matches an existing upload in the chosen project, so it is excluded
  alreadyUploaded: boolean
  status: ItemStatus
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
