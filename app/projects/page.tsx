import React from 'react'
import styles from './page.module.scss'
import { projects } from '@/data/projects'
import Link from 'next/link'
import Image from 'next/image'
import BackButton from '@/components/BackButton'

export const metadata = {
  title: 'Projects | Jesse Lind Photography',
}

const ProjectsPage = () => {
  return (
    <div className={styles.projects}>
      <div className={styles.content}>
        <BackButton current='Projects' />
        <div className={styles.projectsList}>
          {projects.map((project, index) => (
            <div className={styles.projectWrapper} key={project.id}>
              <span className={styles.leftNumbers}>{`${index < 9 ? '0' : ''}${
                index + 1
              }`}</span>
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={styles.projectCard}
              >
                <div className={styles.imageContainer}>
                  <picture>
                    <source
                      media='(max-width: 768px)'
                      srcSet={project.mobilePosterUrl}
                    />
                    <Image
                      src={project.posterUrl}
                      alt={project.name}
                      width={700}
                      height={700}
                      placeholder='blur'
                      blurDataURL={project.thumbnailUrl}
                      className={styles.projectImage}
                    />
                  </picture>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProjectsPage
