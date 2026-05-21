// components/PhotoControls.tsx
import React from 'react'
import styles from './PhotoViewer.module.scss'
import { LayoutGrid, MoveLeft, MoveRight } from 'lucide-react'
import Link from 'next/link'

interface PhotoControlsProps {
  handleClickPrev: () => void
  handleClickNext: () => void
  path: string
  prevBtnRef?: React.Ref<HTMLButtonElement>
  nextBtnRef?: React.Ref<HTMLButtonElement>
}

const PhotoControls = ({
  handleClickPrev,
  handleClickNext,
  path,
  prevBtnRef,
  nextBtnRef,
}: PhotoControlsProps) => {
  return (
    <div className={styles.footer}>
      <div className={styles.controls}>
        <button
          ref={prevBtnRef}
          onClick={handleClickPrev}
          aria-label='Previous photo'
        >
          <MoveLeft size={16} strokeWidth={1} />
        </button>
        <Link href={path} aria-label='Back to gallery' scroll={false}>
          <LayoutGrid size={16} strokeWidth={1} />
        </Link>
        <button
          ref={nextBtnRef}
          onClick={handleClickNext}
          aria-label='Next photo'
        >
          <MoveRight size={16} strokeWidth={1} />
        </button>
      </div>
    </div>
  )
}

export default PhotoControls
