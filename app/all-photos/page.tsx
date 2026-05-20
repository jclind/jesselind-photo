import React from 'react'
import Gallery from './Gallery'
import BackButton from '@/components/BackButton'

export const metadata = {
  title: 'All Photos | Jesse Lind Photography',
  description: 'A Collection of all photos taken and posted by Jesse Lind',
}

const AllPhotosPage = () => {
  return (
    <>
      <BackButton current='All Photos' />
      <Gallery />
    </>
  )
}

export default AllPhotosPage
