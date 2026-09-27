import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  StorageReference,
} from 'firebase/storage'
import {
  collection,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore/lite'
import { db, storage } from '@/lib/firebase'
import { Photo } from '@/types/Photo'
import { getPhotoID } from '@/util/reSerializePhotos'
import { generateBlurPlaceholder } from '@/util/generateBlurPlaceholder'

export type PhotoUploadFields = {
  title: string
  category: string
  description: string
  location: string | null
  projectID: string | null
  photoDate: Date
}

export type PhotoUploadStatus =
  | { state: 'queued' }
  | { state: 'uploading' }
  | { state: 'done'; id: string }
  | { state: 'failed'; reason: string; docId: string }

export type ProjectUpload = {
  seconds: number
  safeName: string | null
}

// Uploads one photo end to end and resolves with its final status instead of
// rejecting (only an invalid photoDate throws), so a batch loop treats
// success and failure uniformly. One photo at a time: the caller must await
// each call in file order before starting the next, so sequenceNumber
// follows that order.
export async function uploadPhoto(
  file: File,
  fields: PhotoUploadFields,
  opts?: { docId?: string; onStatus?: (status: PhotoUploadStatus) => void }
): Promise<PhotoUploadStatus> {
  if (
    !(fields.photoDate instanceof Date) ||
    !Number.isFinite(fields.photoDate.getTime())
  ) {
    throw new Error('photoDate must be a Date with a valid time')
  }

  const emit = (status: PhotoUploadStatus) => opts?.onStatus?.(status)
  emit({ state: 'queued' })
  emit({ state: 'uploading' })

  // The Firestore document key, generated without writing anything. It names
  // the Storage objects permanently; the visible id field is assigned by the
  // transaction from the sequence counter.
  const docId = opts?.docId ?? doc(collection(db, 'photos')).id
  const photoRef = doc(db, 'photos', docId)
  const counterRef = doc(db, 'counters', 'photos')

  // Objects this call uploaded successfully. Only these are ever deleted.
  const uploadedRefs: StorageReference[] = []

  // Marks the photo failed. Objects this call uploaded are deleted only once
  // getDoc confirms the photo doc is absent; if that check fails or the doc
  // exists, nothing is deleted and a retry under the same docId picks up
  // whatever was left.
  const fail = async (reason: string): Promise<PhotoUploadStatus> => {
    if (uploadedRefs.length > 0) {
      let docSnap: DocumentSnapshot
      try {
        docSnap = await getDoc(photoRef)
      } catch (err) {
        console.error('Could not confirm doc absence, skipping cleanup:', err)
        const status = {
          state: 'failed' as const,
          reason:
            reason === 'firestore'
              ? 'firestore-unknown'
              : `${reason}, firestore-unknown`,
          docId,
        }
        emit(status)
        return status
      }
      if (docSnap.exists()) {
        // The doc committed despite the failure, so the photo is live.
        const status = {
          state: 'done' as const,
          id: docSnap.data().id as string,
        }
        emit(status)
        return status
      }
      const cleanupFailures: string[] = []
      for (const uploadedRef of uploadedRefs) {
        try {
          await deleteObject(uploadedRef)
        } catch (err) {
          // An object that never made it is already in the desired state.
          if ((err as { code?: string }).code === 'storage/object-not-found')
            continue
          console.error(`Cleanup delete failed for ${uploadedRef.fullPath}:`, err)
          cleanupFailures.push(`cleanup failed: ${uploadedRef.fullPath}`)
        }
      }
      if (cleanupFailures.length > 0) {
        reason = `${reason}, ${cleanupFailures.join(', ')}`
      }
    }
    const status = { state: 'failed' as const, reason, docId }
    emit(status)
    return status
  }

  let dimensions: { width: number; height: number }
  try {
    dimensions = await getImageDimensionsFromFile(file)
  } catch (err) {
    console.error(err)
    return fail('dimensions')
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `full/${docId}-${safeName}`
  const thumbnailPath = `thumbnails/${docId}-${safeName}`

  // Lazy-load so the ~50 KB compression lib stays out of the page bundle
  let imageCompression: typeof import('browser-image-compression').default
  try {
    imageCompression = (await import('browser-image-compression')).default
  } catch (err) {
    console.error(err)
    return fail('compression-import')
  }

  let fullUrl: string
  try {
    const fullRef = ref(storage, storagePath)
    await uploadBytes(fullRef, file)
    uploadedRefs.push(fullRef)
    fullUrl = await getDownloadURL(fullRef)
  } catch (err) {
    console.error(err)
    return fail('full-upload')
  }

  let thumbBlob: Blob
  try {
    thumbBlob = await imageCompression(file, {
      maxWidthOrHeight: 500,
      useWebWorker: true,
    })
  } catch (err) {
    console.error(err)
    return fail('thumbnail-compression')
  }

  let thumbUrl: string
  try {
    const thumbRef = ref(storage, thumbnailPath)
    await uploadBytes(thumbRef, thumbBlob)
    uploadedRefs.push(thumbRef)
    thumbUrl = await getDownloadURL(thumbRef)
  } catch (err) {
    console.error(err)
    return fail('thumbnail-upload')
  }

  let blurDataURL: string
  try {
    blurDataURL = await generateBlurPlaceholder(thumbBlob)
  } catch (err) {
    console.error(err)
    return fail('blur')
  }

  let id: string
  try {
    id = await runTransaction(db, async transaction => {
      // Firestore calls only; the uploads are already done, so a contested
      // transaction re-runs cheaply against the same Storage objects.
      const photoSnap = await transaction.get(photoRef)
      // A previous attempt under this docId may have committed without the
      // client seeing it. Write nothing; the retry is a no-op.
      if (photoSnap.exists()) return photoSnap.data().id as string

      const counterSnap = await transaction.get(counterRef)
      let lastSequenceNumber = 0
      if (counterSnap.exists()) {
        lastSequenceNumber = counterSnap.data().lastSequenceNumber || 0
      } else {
        transaction.set(counterRef, { lastSequenceNumber: 0 })
      }

      const sequenceNumber = lastSequenceNumber + 1
      const sequenceId = getPhotoID(sequenceNumber)
      transaction.set(photoRef, {
        id: sequenceId,
        title: fields.title,
        category: fields.category,
        description: fields.description,
        location: fields.location || null,
        storagePath,
        thumbnailPath,
        projectID: fields.projectID || null,
        fullUrl,
        thumbnailUrl: thumbUrl,
        blurDataURL,
        width: dimensions.width,
        height: dimensions.height,
        createdAt: serverTimestamp(),
        photoDate: fields.photoDate,
        sequenceNumber,
      })
      transaction.update(counterRef, { lastSequenceNumber: sequenceNumber })
      return sequenceId
    })
  } catch (err) {
    console.error(err)
    return fail('firestore')
  }

  const status = { state: 'done' as const, id }
  emit(status)
  return status
}

// Existing uploads in a project, for the caller's duplicate check: a picked
// file duplicates an upload only when capture second and filename both match.
export async function fetchProjectUploads(
  projectID: string
): Promise<ProjectUpload[]> {
  const snapshot = await getDocs(
    query(collection(db, 'photos'), where('projectID', '==', projectID))
  )
  return snapshot.docs
    .map(d => d.data() as Photo)
    .filter(photo => photo.photoDate)
    .map(photo => ({
      seconds: photo.photoDate.seconds,
      safeName: safeNameFromStoragePath(photo.storagePath),
    }))
}

// New-flow object names are `<20-char doc key>-<safeName>`; any other shape
// (all pre-existing photos) yields null.
function safeNameFromStoragePath(storagePath?: string): string | null {
  if (!storagePath) return null
  const name = storagePath.slice(storagePath.lastIndexOf('/') + 1)
  return /^[A-Za-z0-9]{20}-/.test(name) ? name.slice(21) : null
}

async function getImageDimensionsFromFile(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = reject

    const reader = new FileReader()
    reader.onload = e => {
      if (e.target?.result) {
        img.src = e.target.result as string
      } else {
        reject(new Error('File read returned no data'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
