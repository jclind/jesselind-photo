import React from 'react'
import CollectionGallery from './CollectionGallery'
import { categories } from '@/data/categories'

export const generateStaticParams = async () => {
  return categories.map(c => ({
    collectionID: c.path.replace(/^\/collections\//, ''),
  }))
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ collectionID: string }>
}) => {
  const { collectionID } = await params
  return {
    title: `${collectionID || 'Collection'} | Jesse Lind Photography`,
    description: `A Collection of photos in the ${
      collectionID || 'Collection'
    } category by Jesse Lind`,
  }
}

const CollectionPage = () => {
  return <CollectionGallery />
}

export default CollectionPage
