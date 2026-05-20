import React from 'react'
import CollectionGallery from './CollectionGallery'
import { categories } from '@/data/categories'
import JsonLd from '@/components/JsonLd'
import { buildCollectionPageLd } from '@/lib/jsonLd'
import BackButton from '@/components/BackButton'

const titleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase())

export const generateStaticParams = async () => {
  return categories
    .filter(c => !c.hidden)
    .map(c => ({ collectionID: c.slug }))
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ collectionID: string }>
}) => {
  const { collectionID } = await params
  const category = categories.find(c => c.slug === collectionID)
  const displayName = category ? titleCase(category.name) : collectionID
  const title = `${displayName || 'Collection'} | Jesse Lind Photography`
  const description = category
    ? `Browse ${category.name} photography by Jesse Lind.`
    : `Browse photography by Jesse Lind.`
  const canonical = category?.path || `/collections/${collectionID}`
  const images = category
    ? [
        {
          url: category.imgSrc,
          width: 3120,
          height: 2080,
          alt: `${displayName} photography by Jesse Lind`,
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
      type: 'website',
      ...(images && { images }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(images && { images: images.map(i => i.url) }),
    },
  }
}

const CollectionPage = async ({
  params,
}: {
  params: Promise<{ collectionID: string }>
}) => {
  const { collectionID } = await params
  const category = categories.find(
    c => c.path === `/collections/${collectionID}`
  )
  return (
    <>
      {category && <JsonLd data={buildCollectionPageLd(category)} />}
      <BackButton
        href='/collections'
        label='Collections'
        current={category ? titleCase(category.name) : collectionID}
      />
      <CollectionGallery />
    </>
  )
}

export default CollectionPage
