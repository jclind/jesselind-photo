'use client'

import { ProjectType } from '@/data/projects'
import GalleryTemplate from '@/components/GalleryTemplate'
import { db } from '@/lib/firebase'
import { Photo } from '@/types/Photo'
import {
  QueryDocumentSnapshot,
  collection,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  getDocs,
  getCount,
} from 'firebase/firestore/lite'

type ProjectGalleryProps = {
  currProject: ProjectType
}

const PAGE_SIZE = 20

const ProjectGallery = ({ currProject }: ProjectGalleryProps) => {
  if (!currProject) {
    return <div>Project not found</div>
  }

  const projectID = currProject.id
  const imagePath = `/projects/${projectID}`
  const fetchPhotos = async (lastDoc?: QueryDocumentSnapshot) => {
    const photosRef = collection(db, 'photos')
    // Create the query filtered by category
    const q = lastDoc
      ? query(
          photosRef,
          where('projectID', '==', projectID),
          orderBy('sequenceNumber', 'asc'),
          startAfter(lastDoc),
          limit(PAGE_SIZE),
        )
      : query(
          photosRef,
          where('projectID', '==', projectID),
          orderBy('sequenceNumber', 'asc'),
          limit(PAGE_SIZE),
        )

    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return { photos: [], lastDoc: null }
    }

    const photos: Photo[] = snapshot.docs.map(doc => doc.data() as Photo)
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1]

    return { photos, lastDoc: newLastDoc }
  }

  // No orderBy, so this needs only the single-field index Firestore maintains
  // automatically. Adding one would mean a composite index per project.
  const countPhotos = async () => {
    const snapshot = await getCount(
      query(collection(db, 'photos'), where('projectID', '==', projectID))
    )
    return snapshot.data().count
  }

  return (
    <GalleryTemplate
      fetchPhotos={fetchPhotos}
      countPhotos={countPhotos}
      imagePath={imagePath}
      topGapSmall={true}
    />
  )
}

export default ProjectGallery
