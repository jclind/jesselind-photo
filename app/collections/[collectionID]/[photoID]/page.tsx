import React from 'react'
import CollectionsPhoto from './CollectionsPhoto'

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ photoID: string }>
}) => {
  const { photoID } = await params
  return {
    title: `${photoID || 'Photo'} | Jesse Lind Photography`,
    description: `View photo ${photoID || ''} by Jesse Lind`,
  }
}

const CollectionsPhotoPage = () => {
  return <CollectionsPhoto />
}

export default CollectionsPhotoPage
