import { projects } from '@/data/projects'
import React from 'react'
import Image from 'next/image'
import styles from './page.module.scss'
import ProjectGallery from './ProjectGallery'

export const generateStaticParams = async () => {
  return projects.map(p => ({ projectID: p.id }))
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ projectID: string }>
}) => {
  const { projectID } = await params
  const projectName = projects.find(p => p.id === projectID)?.name || projectID
  return {
    title: `${projectName || 'Project'} | Jesse Lind Photography`,
    description: `A collection of photos in the project ${
      projectName || ''
    } category by Jesse Lind`,
  }
}

interface PageProps {
  params: Promise<{ projectID: string }>
}

const ProjectPage = async ({ params }: PageProps) => {
  const { projectID } = await params
  const currProject = projects.find(p => p.id === projectID)
  if (!currProject) {
    return null
  }
  return (
    <div className={styles.projectPage}>
      <div className={styles.header}>
        <div className={styles.imageContainer}>
          <Image
            src={currProject.posterUrl}
            alt=''
            width={2000}
            height={2000}
            priority
            fetchPriority='high'
            sizes='(max-width: 768px) 92vw, 500px'
            placeholder='blur'
            blurDataURL={currProject.thumbnailUrl}
          />
        </div>
        <div className={styles.text}>
          <h1>{currProject.name}</h1>
          <p className={styles.date}>
            {new Date(currProject.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p>{currProject.description}</p>
        </div>
      </div>
      <ProjectGallery currProject={currProject} />
    </div>
  )
}

export default ProjectPage
