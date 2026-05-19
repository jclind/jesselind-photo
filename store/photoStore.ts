import { create } from 'zustand'
import { Photo } from '@/types/Photo'

interface PhotoStore {
  cache: Record<string, Photo>
  addPhoto: (photo: Photo) => void
}

export const usePhotoStore = create<PhotoStore>(set => ({
  cache: {},
  addPhoto: photo =>
    set(state => ({ cache: { ...state.cache, [photo.id]: photo } })),
}))
