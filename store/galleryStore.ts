import { create } from 'zustand'
import type { QueryDocumentSnapshot } from 'firebase/firestore/lite'
import { Photo } from '@/types/Photo'

export interface GalleryEntry {
  photos: Photo[]
  lastDoc: QueryDocumentSnapshot | null
  hasMore: boolean
  scrollY: number
  isThumbnailMode: boolean
}

interface GalleryStore {
  entries: Record<string, GalleryEntry>
  previousPath: string | null
  currentPath: string | null
  setEntry: (key: string, entry: GalleryEntry) => void
  patchEntry: (key: string, patch: Partial<GalleryEntry>) => void
  clearEntry: (key: string) => void
  recordPath: (path: string) => void
}

export const useGalleryStore = create<GalleryStore>(set => ({
  entries: {},
  previousPath: null,
  currentPath: null,
  setEntry: (key, entry) =>
    set(s => ({ entries: { ...s.entries, [key]: entry } })),
  patchEntry: (key, patch) =>
    set(s => {
      const prev = s.entries[key]
      if (!prev) return s
      return { entries: { ...s.entries, [key]: { ...prev, ...patch } } }
    }),
  clearEntry: (key) =>
    set(s => {
      if (!s.entries[key]) return s
      const next = { ...s.entries }
      delete next[key]
      return { entries: next }
    }),
  recordPath: path =>
    set(s =>
      s.currentPath === path
        ? s
        : { previousPath: s.currentPath, currentPath: path }
    ),
}))
