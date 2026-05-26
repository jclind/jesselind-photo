import React from 'react'
import CollectionsPhoto from './CollectionsPhoto'
import { getPhotoServer } from '@/lib/getPhotoServer'
import { buildPhotoMetadata } from '@/lib/photoMetadata'
import { buildBreadcrumbLd, buildPhotographLd } from '@/lib/jsonLd'
import JsonLd from '@/components/JsonLd'
import { categories } from '@/data/categories'

const titleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase())

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ photoID: string }>
}) => {
  const { photoID } = await params
  const photo = await getPhotoServer(photoID)
  return buildPhotoMetadata(photo, photoID)
}

const CollectionsPhotoPage = async ({
  params,
}: {
  params: Promise<{ collectionID: string; photoID: string }>
}) => {
  const { collectionID, photoID } = await params
  const photo = await getPhotoServer(photoID)
  const category = categories.find(c => c.slug === collectionID)
  const breadcrumb = buildBreadcrumbLd([
    { name: 'Home', url: '/' },
    { name: 'Collections', url: '/collections' },
    ...(category
      ? [{ name: titleCase(category.name), url: category.path }]
      : []),
    { name: photoID, url: `/collections/${collectionID}/${photoID}` },
  ])
  return (
    <>
      {photo && <JsonLd data={buildPhotographLd(photo, photoID)} />}
      <JsonLd data={breadcrumb} />
      <CollectionsPhoto />
    </>
  )
}

export default CollectionsPhotoPage
