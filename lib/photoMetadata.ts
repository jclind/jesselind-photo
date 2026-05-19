import type { Metadata } from 'next'
import type { Photo } from '@/types/Photo'

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const formatDate = (photo: Photo): string | null => {
  const date = photo.photoDate?.toDate?.()
  if (!date) return null
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

const buildTitle = (photo: Photo | null, photoID: string): string => {
  if (!photo) return `${photoID} | Jesse Lind Photography`
  const title = photo.title?.trim()
  if (title) return `${title} | Jesse Lind Photography`
  const parts: string[] = []
  if (photo.category) parts.push(capitalize(photo.category))
  if (photo.location) parts.push(photo.location)
  if (parts.length) return `${parts.join(' — ')} | Jesse Lind Photography`
  return `Photo ${photoID} | Jesse Lind Photography`
}

const buildDescription = (photo: Photo | null, photoID: string): string => {
  if (!photo) return `View photo ${photoID} by Jesse Lind.`
  const parts: string[] = []
  const title = photo.title?.trim()
  if (title) {
    parts.push(title)
  } else if (photo.category) {
    parts.push(`${capitalize(photo.category)} photograph`)
  } else {
    parts.push('Photograph')
  }
  parts.push('by Jesse Lind')
  if (photo.location) parts.push(photo.location)
  const date = formatDate(photo)
  if (date) parts.push(date)
  return parts.join(' — ') + '.'
}

const buildAlt = (photo: Photo): string => {
  const title = photo.title?.trim()
  if (title) return title
  const parts: string[] = []
  const subject = photo.category
    ? `${capitalize(photo.category)} photograph`
    : 'Photograph'
  parts.push(`${subject} by Jesse Lind`)
  if (photo.location) parts.push(photo.location)
  return parts.join(', ')
}

export function buildPhotoMetadata(
  photo: Photo | null,
  photoID: string
): Metadata {
  const canonical = `/all-photos/${photoID}`
  const title = buildTitle(photo, photoID)
  const description = buildDescription(photo, photoID)

  const ogImage =
    photo?.fullUrl && photo.width && photo.height
      ? [
          {
            url: photo.fullUrl,
            width: photo.width,
            height: photo.height,
            alt: buildAlt(photo),
          },
        ]
      : undefined

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      ...(ogImage && { images: ogImage }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage && { images: ogImage.map(i => i.url) }),
    },
  }
}
