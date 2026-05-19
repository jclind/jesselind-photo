export type CollectionType = {
  name: string
  slug: string
  imgSrc: string
  path: string
  hidden?: boolean
}

export const categories: CollectionType[] = [
  {
    name: 'landscape',
    slug: 'landscape',
    imgSrc: '/images/collections/landscape.webp',
    path: '/collections/landscape',
  },
  {
    name: 'nature',
    slug: 'nature',
    imgSrc: '/images/collections/nature.webp',
    path: '/collections/nature',
  },
  {
    name: 'animals',
    slug: 'animals',
    imgSrc: '/images/collections/animals.webp',
    path: '/collections/animals',
  },
  {
    name: 'architecture',
    slug: 'architecture',
    imgSrc: '/images/collections/architecture.webp',
    path: '/collections/architecture',
  },
  {
    name: 'urban',
    slug: 'urban',
    imgSrc: '/images/collections/urban.webp',
    path: '/collections/urban',
  },
  {
    name: 'seascape',
    slug: 'seascape',
    imgSrc: '/images/collections/seascape.webp',
    path: '/collections/seascape',
  },
  {
    name: 'abstract',
    slug: 'abstract',
    imgSrc: '/images/collections/abstract.webp',
    path: '/collections/abstract',
  },
  {
    name: 'astronomy',
    slug: 'astronomy',
    imgSrc: '/images/collections/astronomy.webp',
    path: '/collections/astronomy',
  },
  {
    name: 'people',
    slug: 'people',
    imgSrc: '/images/collections/people.webp',
    path: '/collections/people',
  },
  {
    name: 'plane & machine',
    slug: 'plane-and-machine',
    imgSrc: '/images/collections/plane-and-machine.webp',
    path: '/collections/plane-and-machine',
    hidden: true,
  },
  {
    name: 'studio',
    slug: 'studio',
    imgSrc: '/images/collections/studio.webp',
    path: '/collections/studio',
  },
]
