import SinglePhoto from './SinglePhoto'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ photoID: string }>
}) {
  const { photoID } = await params
  return {
    title: `${photoID || 'Photo'} | Jesse Lind Photography`,
    description: `View photo ${photoID || ''} by Jesse Lind`,
  }
}

const SinglePhotoPage = () => {
  return <SinglePhoto />
}

export default SinglePhotoPage
