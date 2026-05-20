import { projects } from '@/data/projects'
import React from 'react'
import Image from 'next/image'
import styles from './page.module.scss'
import ProjectGallery from './ProjectGallery'
import JsonLd from '@/components/JsonLd'
import { buildImageGalleryLd } from '@/lib/jsonLd'
import BackButton from '@/components/BackButton'

export const generateStaticParams = async () => {
  return projects.map(p => ({ projectID: p.id }))
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ projectID: string }>
}) => {
  const { projectID } = await params
  const project = projects.find(p => p.id === projectID)
  const title = `${project?.name || 'Project'} | Jesse Lind Photography`
  const description =
    project?.description ||
    `A photography project by Jesse Lind`
  const canonical = `/projects/${projectID}`
  const images = project
    ? [
        {
          url: project.posterUrl,
          width: 2000,
          height: 2000,
          alt: project.name,
        },
      ]
    : undefined
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      ...(images && { images }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(images && { images: images.map(i => i.url) }),
    },
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
      <JsonLd data={buildImageGalleryLd(currProject)} />
      <BackButton
        href='/projects'
        label='Projects'
        current={currProject.name}
        currentAsHeading={false}
      />
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
