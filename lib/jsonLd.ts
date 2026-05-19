import type { Photo } from '@/types/Photo'
import type { ProjectType } from '@/data/projects'
import type { CollectionType } from '@/data/categories'
import { CONTACT_LINKS, PHOTO_WEBSITE_URL } from '@/data/contact'

const SITE_URL = PHOTO_WEBSITE_URL
const PERSON_ID = `${SITE_URL}/#person`
const WEBSITE_ID = `${SITE_URL}/#website`

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const titleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase())
const absolute = (urlOrPath: string) =>
  /^https?:\/\//i.test(urlOrPath) ? urlOrPath : `${SITE_URL}${urlOrPath}`

const personSameAs = (): string[] =>
  CONTACT_LINKS.map(l => l.link).filter(
    link => /^https?:\/\//i.test(link) && !link.startsWith('mailto:')
  )

export const buildSiteAndPersonLd = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: SITE_URL,
      name: 'Jesse Lind Photography',
      description: 'Photography portfolio of Jesse Lind',
      inLanguage: 'en-US',
      publisher: { '@id': PERSON_ID },
    },
    {
      '@type': 'Person',
      '@id': PERSON_ID,
      name: 'Jesse Lind',
      url: SITE_URL,
      image: `${SITE_URL}/default-og.webp`,
      jobTitle: 'Photographer',
      sameAs: personSameAs(),
    },
  ],
})

export const buildPhotographLd = (photo: Photo, photoID: string) => {
  const canonicalUrl = `${SITE_URL}/all-photos/${photoID}`
  const title = photo.title?.trim()
  const name =
    title ||
    (photo.category
      ? `${capitalize(photo.category)} photograph by Jesse Lind`
      : 'Photograph by Jesse Lind')
  const descParts: string[] = []
  if (title) descParts.push(title)
  if (photo.location) descParts.push(photo.location)
  const description = descParts.length ? descParts.join(' — ') : name

  const isoDate = photo.photoDate?.toDate?.()?.toISOString()

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Photograph',
    '@id': `${canonicalUrl}#photograph`,
    url: canonicalUrl,
    name,
    description,
    representativeOfPage: true,
    creditText: 'Jesse Lind',
    copyrightNotice: '© Jesse Lind',
    creator: { '@id': PERSON_ID },
    copyrightHolder: { '@id': PERSON_ID },
    license: `${SITE_URL}/about`,
    acquireLicensePage: `${SITE_URL}/about`,
  }

  if (photo.fullUrl) ld.contentUrl = photo.fullUrl
  if (photo.thumbnailUrl) ld.thumbnailUrl = photo.thumbnailUrl
  if (photo.width) {
    ld.width = {
      '@type': 'QuantitativeValue',
      value: photo.width,
      unitCode: 'E37',
    }
  }
  if (photo.height) {
    ld.height = {
      '@type': 'QuantitativeValue',
      value: photo.height,
      unitCode: 'E37',
    }
  }
  if (isoDate) {
    ld.datePublished = isoDate
    ld.dateCreated = isoDate
  }
  if (photo.location) {
    ld.contentLocation = { '@type': 'Place', name: photo.location }
  }

  return ld
}

export const buildImageGalleryLd = (project: ProjectType) => {
  const url = `${SITE_URL}/projects/${project.id}`
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    '@id': `${url}#gallery`,
    url,
    name: project.name,
    description: project.description,
    image: absolute(project.posterUrl),
    dateCreated: new Date(project.date).toISOString(),
    creator: { '@id': PERSON_ID },
    isPartOf: { '@id': WEBSITE_ID },
  }
}

export const buildBreadcrumbLd = (
  trail: Array<{ name: string; url: string }>
) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: absolute(item.url),
  })),
})

export const buildCollectionPageLd = (category: CollectionType) => {
  const url = `${SITE_URL}${category.path}`
  const name = titleCase(category.name)
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    name: `${name} | Jesse Lind Photography`,
    about: category.name,
    image: absolute(category.imgSrc),
    isPartOf: { '@id': WEBSITE_ID },
  }
}
