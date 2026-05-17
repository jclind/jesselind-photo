import React from 'react'
import ProjectPhoto from './ProjectPhoto'

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ photoID: string }>
}) => {
  const { photoID } = await params
  return {
    title: `${photoID || 'Photo'} | Jesse Lind Photography`,
    description: `View ${photoID || 'this photo'} by Jesse Lind`,
  }
}

const CollectionsPhotoPage = () => {
  return <ProjectPhoto />
}

export default CollectionsPhotoPage
