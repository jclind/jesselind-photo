import React from 'react'
import ProjectPhoto from './ProjectPhoto'
import { getPhotoServer } from '@/lib/getPhotoServer'
import { buildPhotoMetadata } from '@/lib/photoMetadata'
import { buildBreadcrumbLd, buildPhotographLd } from '@/lib/jsonLd'
import JsonLd from '@/components/JsonLd'
import { projects } from '@/data/projects'

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
  params: Promise<{ projectID: string; photoID: string }>
}) => {
  const { projectID, photoID } = await params
  const photo = await getPhotoServer(photoID)
  const project = projects.find(p => p.id === projectID)
  const breadcrumb = buildBreadcrumbLd([
    { name: 'Home', url: '/' },
    { name: 'Projects', url: '/projects' },
    ...(project
      ? [{ name: project.name, url: `/projects/${projectID}` }]
      : []),
    { name: photoID, url: `/projects/${projectID}/${photoID}` },
  ])
  return (
    <>
      {photo && <JsonLd data={buildPhotographLd(photo, photoID)} />}
      <JsonLd data={breadcrumb} />
      <ProjectPhoto />
    </>
  )
}

export default CollectionsPhotoPage
