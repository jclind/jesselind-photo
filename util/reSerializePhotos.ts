import { db } from '@/lib/firebase'
import { Photo } from '@/types/Photo'
import {
  collection,
  doc,
  DocumentReference,
  getDocs,
  writeBatch,
} from 'firebase/firestore/lite'

export const getPhotoID = (sequenceNumber: number) => {
  return String(sequenceNumber).padStart(5, '0')
}

export const reSerializePhotos = async () => {
  try {
    const photosRef = collection(db, 'photos')
    const snapshot = await getDocs(photosRef)

    // Extract docs
    let photos: (Photo & { docRef: DocumentReference })[] = snapshot.docs.map(
      d => {
        const data = d.data() as Photo
        return {
          docRef: d.ref,
          ...data,
        }
      }
    )

    // Sort by photoDate (ascending). Cascade through nanoseconds, then docRef
    // id, so photos sharing a second (common when photoDate comes from the
    // day-resolution date picker) get a deterministic order across runs —
    // otherwise getDocs's unspecified ordering would let the renumber shuffle
    // them and break any external links to those photo ids.
    photos.sort((a, b) => {
      const s = a.photoDate.seconds - b.photoDate.seconds
      if (s !== 0) return s
      const n = (a.photoDate.nanoseconds ?? 0) - (b.photoDate.nanoseconds ?? 0)
      if (n !== 0) return n
      return a.docRef.id.localeCompare(b.docRef.id)
    })

    const batch = writeBatch(db)

    // Reassign sequence numbers + ids
    photos.forEach((photo, index) => {
      const sequenceNumber = index
      const id = getPhotoID(sequenceNumber)

      batch.update(photo.docRef, {
        sequenceNumber,
        id,
      })
    })

    // Update counter
    const counterRef = doc(db, 'counters', 'photos')
    batch.update(counterRef, {
      lastSequenceNumber: photos.length - 1,
    })

    await batch.commit()

    console.log('Re-serialization complete ✅')
  } catch (err) {
    console.error('Error re-serializing photos:', err)
  }
}
