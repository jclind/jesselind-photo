'use client'

import PhotoViewer from '@/components/PhotoViewer'
import { PhotoViewerFilterType } from '@/types/Photo'
import { useParams } from 'next/navigation'

const ProjectPhoto = () => {
  const { projectID, photoID } = useParams<{
    projectID: string
    photoID: string
  }>()
  const filteredParams = { photoID }
  const path = `/projects/${projectID}`
  const filter: PhotoViewerFilterType = {
    field: 'projectID',
    value: projectID,
  }
  return <PhotoViewer params={filteredParams} path={path} filter={filter} />
}

export default ProjectPhoto
