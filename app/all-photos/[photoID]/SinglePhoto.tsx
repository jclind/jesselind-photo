'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'

const PhotoViewer = dynamic(() => import('@/components/PhotoViewer'), {
  ssr: false,
})

const SinglePhoto = () => {
  const params = useParams<{ photoID: string }>()

  const path = '/all-photos' // Define the path for navigation
  return <PhotoViewer params={params} path={path} />
}

export default SinglePhoto
