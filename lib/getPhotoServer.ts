import { cache } from 'react'
import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  query,
  where,
} from 'firebase/firestore/lite'
import type { Photo } from '@/types/Photo'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const serverApp = () =>
  getApps().length ? getApp() : initializeApp(firebaseConfig)

export const getPhotoServer = cache(
  async (photoID: string): Promise<Photo | null> => {
    if (!photoID) return null
    try {
      const db = getFirestore(serverApp())
      const snap = await getDocs(
        query(
          collection(db, 'photos'),
          where('id', '==', photoID),
          limit(1)
        )
      )
      return snap.empty ? null : (snap.docs[0].data() as Photo)
    } catch (err) {
      console.warn('[getPhotoServer] fetch failed for', photoID, err)
      return null
    }
  }
)
