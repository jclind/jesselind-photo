import { db } from '@/lib/firebase'
import { Photo } from '@/types/Photo'
import {
  collection,
  getDocs,
  updateDoc,
} from 'firebase/firestore/lite'
import { generateBlurPlaceholder } from './generateBlurPlaceholder'

// Iterates every photo in Firestore, fetches its thumbnail, generates a tiny
// base64 placeholder, and writes it back to the doc. Skips photos that already
// have one. Requires CORS to be configured on the Firebase Storage bucket so
// the browser can fetch the thumbnail as a Blob — set this once via
// `gsutil cors set` (see Firebase docs).
export const backfillBlurPlaceholders = async (): Promise<{
  updated: number
  skipped: number
  failed: number
}> => {
  const snap = await getDocs(collection(db, 'photos'))

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const docSnap of snap.docs) {
    const photo = docSnap.data() as Photo
    if (photo.blurDataURL) {
      skipped++
      continue
    }
    if (!photo.thumbnailUrl) {
      skipped++
      continue
    }
    // Only ever fetch from Firebase Storage. A doc with a non-Firebase URL
    // (forged or accidental) would otherwise turn this admin tool into an
    // arbitrary-URL GET from the admin's network.
    try {
      const parsed = new URL(photo.thumbnailUrl)
      if (parsed.hostname !== 'firebasestorage.googleapis.com') {
        console.warn(
          `backfill skipped ${photo.id}: untrusted host ${parsed.hostname}`
        )
        skipped++
        continue
      }
    } catch {
      console.warn(`backfill skipped ${photo.id}: invalid thumbnailUrl`)
      skipped++
      continue
    }
    try {
      const res = await fetch(photo.thumbnailUrl, { mode: 'cors' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const blurDataURL = await generateBlurPlaceholder(blob)
      await updateDoc(docSnap.ref, { blurDataURL })
      updated++
    } catch (err) {
      console.warn(`backfill failed for ${photo.id}:`, err)
      failed++
    }
  }

  return { updated, skipped, failed }
}
