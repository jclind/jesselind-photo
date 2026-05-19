import { Photo } from '@/types/Photo'

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const getPhotoAlt = (photo: Photo): string => {
  const title = photo.title?.trim()
  if (title) return title

  const subject = photo.category ? `${capitalize(photo.category)} photograph` : 'Photograph'
  const parts: string[] = [`${subject} by Jesse Lind`]
  if (photo.location) parts.push(photo.location)
  const year = photo.photoDate?.toDate?.().getFullYear()
  if (year) parts.push(String(year))
  return parts.join(', ')
}
