import React from 'react'
import CollectionGallery from './CollectionGallery'

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
