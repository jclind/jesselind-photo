import React, { useRef, useState } from 'react'
import styles from './page.module.scss'
import { ImageUp } from 'lucide-react'

export const MAX_FILE_MB = 20
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

type DropZoneProps = {
  disabled: boolean
  onFiles: (files: File[]) => void
  rejected: string[]
}

export default function DropZone({ disabled, onFiles, rejected }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <button
        type='button'
        className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''}`}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragLeave={e => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOver(false)
          }
        }}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          if (!disabled) onFiles(Array.from(e.dataTransfer.files))
        }}
      >
        <ImageUp strokeWidth={1} />
        <span>Drop images here or click to choose files</span>
        <span className={styles.dropZoneHint}>
          JPEG, PNG or WebP, up to {MAX_FILE_MB} MB each. Adding more appends to
          the batch.
        </span>
      </button>
      <input
        ref={inputRef}
        className='visually-hidden'
        type='file'
        accept={ALLOWED_TYPES.join(',')}
        multiple
        tabIndex={-1}
        aria-hidden='true'
        onChange={e => {
          onFiles(Array.from(e.target.files ?? []))
          // Reset so picking the same file again still fires onChange
          e.target.value = ''
        }}
      />
      {rejected.length > 0 && (
        <ul className={styles.rejectedList} aria-live='polite'>
          {rejected.map((message, i) => (
            <li key={i}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
