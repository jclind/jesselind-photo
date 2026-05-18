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

    // Sort by photoDate (ascending)
    photos.sort((a, b) => a.photoDate.seconds - b.photoDate.seconds)

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
