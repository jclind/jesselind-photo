'use client'

import PhotoViewer from '@/components/PhotoViewer'

import { useParams } from 'next/navigation'

const SinglePhoto = () => {
  const params = useParams<{ photoID: string }>()

  const path = '/all-photos' // Define the path for navigation
  return <PhotoViewer params={params} path={path} />
}

export default SinglePhoto
