// src/store/photoStore.ts
import { create } from 'zustand'
import { Photo } from '@/types/Photo'

export interface CachedPhoto {
  photo: Photo
  preloadedUrl?: string
}

interface PhotoStore {
  cache: Record<string, CachedPhoto>
  addPhoto: (photoID: string, data: CachedPhoto) => void
  getPhoto: (photoID: string) => CachedPhoto | undefined
}

export const usePhotoStore = create<PhotoStore>((set, get) => ({
  cache: {},
  addPhoto: (photoID, data) =>
    set(state => ({ cache: { ...state.cache, [photoID]: data } })),
  getPhoto: photoID => get().cache[photoID],
}))
