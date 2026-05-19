'use client'

import dynamic from 'next/dynamic'
import { PhotoViewerFilterType } from '@/types/Photo'
import { useParams } from 'next/navigation'

const PhotoViewer = dynamic(() => import('@/components/PhotoViewer'), {
  ssr: false,
})

const CollectionsPhotoPage = () => {
  const { collectionID, photoID } = useParams<{
    collectionID: string
    photoID: string
  }>()
  const filteredParams = { photoID }
  const path = `/collections/${collectionID}`
  const filter: PhotoViewerFilterType = {
    field: 'category',
    value: collectionID,
  }
  return <PhotoViewer params={filteredParams} path={path} filter={filter} />
}

export default CollectionsPhotoPage
