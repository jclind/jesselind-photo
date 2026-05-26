'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useGalleryStore } from '@/store/galleryStore'

// Rotates the previous/current pathname in galleryStore on every client-side
// navigation. GalleryTemplate reads `currentPath` on mount to decide whether
// the user is returning from its photo viewer (in which case it restores
// cached state) or arriving from somewhere else (in which case it starts
// fresh). Child effects fire before parent effects, so on mount the store
// still reflects the path we navigated *from* — that is the value we need.
export default function NavigationTracker() {
  const pathname = usePathname()
  useEffect(() => {
    useGalleryStore.getState().recordPath(pathname)
  }, [pathname])
  return null
}
