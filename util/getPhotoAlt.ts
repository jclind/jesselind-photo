import { Photo } from '@/types/Photo'

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const getPhotoAlt = (photo: Photo): string => {
  const title = photo.title?.trim()
  if (title) return title

  const parts: string[] = []
  if (photo.category) parts.push(capitalize(photo.category))
  if (photo.location) parts.push(photo.location)
  if (parts.length) return parts.join(', ')

  return 'Photograph'
}
