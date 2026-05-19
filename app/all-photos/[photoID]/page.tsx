import SinglePhoto from './SinglePhoto'
import { getPhotoServer } from '@/lib/getPhotoServer'
import { buildPhotoMetadata } from '@/lib/photoMetadata'
import { buildBreadcrumbLd, buildPhotographLd } from '@/lib/jsonLd'
import JsonLd from '@/components/JsonLd'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ photoID: string }>
}) {
  const { photoID } = await params
  const photo = await getPhotoServer(photoID)
  return buildPhotoMetadata(photo, photoID)
}

const SinglePhotoPage = async ({
  params,
}: {
  params: Promise<{ photoID: string }>
}) => {
  const { photoID } = await params
  const photo = await getPhotoServer(photoID)
  const breadcrumb = buildBreadcrumbLd([
    { name: 'Home', url: '/' },
    { name: 'All Photos', url: '/all-photos' },
    { name: photoID, url: `/all-photos/${photoID}` },
  ])
  return (
    <>
      {photo && <JsonLd data={buildPhotographLd(photo, photoID)} />}
      <JsonLd data={breadcrumb} />
      <SinglePhoto />
    </>
  )
}

export default SinglePhotoPage
