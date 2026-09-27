'use client'

import React, { useState, useEffect, useRef } from 'react'
import styles from './page.module.scss'
import { categories, CollectionType } from '@/data/categories'
import { projects, ProjectType } from '@/data/projects'
import AdminNav from '../AdminNav'
import AdminGate from '@/components/AdminGate'
import { uploadPhoto } from '@/util/uploadPhotos'

const MAX_FILE_MB = 20
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function AddPhoto() {
  // Metadata inputs that apply to all files
  const [title, setTitle] = useState('')
  const [photoDate, setPhotoDate] = useState<string>('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('')
  const [projectID, setProjectID] = useState('')
  const [description, setDescription] = useState('')

  // Files & previews
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  // Mirrors previewUrls so the unmount cleanup can revoke the last batch
  // without re-running every time the selection changes.
  const previewUrlsRef = useRef<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  // A failed photo keeps its doc key, so resubmitting it can't create a second
  // doc if the first attempt committed without the page seeing it.
  const retryDocIds = useRef(new WeakMap<File, string>())

  // Object URLs are created alongside the selection rather than derived from it
  // in an effect, so every URL has exactly one revoke.
  const selectFiles = (nextFiles: File[]) => {
    previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
    const urls = nextFiles.map(file => URL.createObjectURL(file))
    previewUrlsRef.current = urls
    setFiles(nextFiles)
    setPreviewUrls(urls)
  }

  const [loading, setLoading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const [formStatus, setFormStatus] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(
    () => () => previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url)),
    []
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormStatus(null)
    setFileError(null)
    setDateError(null)

    if (files.length === 0) {
      setFileError('Please select at least one image.')
      return
    }
    if (!photoDate) {
      setDateError('Please enter a valid date.')
      return
    }
    const createdDate = new Date(photoDate)

    setLoading(true)

    try {
      const failedFiles: File[] = []
      const failures: string[] = []
      let uploaded = 0

      // Sequential on purpose: awaiting each upload in files order is what
      // keeps sequenceNumber aligned with the picked order.
      for (const file of files) {
        const status = await uploadPhoto(
          file,
          {
            title,
            category,
            description,
            location,
            projectID,
            photoDate: createdDate,
          },
          { docId: retryDocIds.current.get(file) }
        )
        if (status.state === 'done') {
          uploaded++
          retryDocIds.current.delete(file)
        } else if (status.state === 'failed') {
          retryDocIds.current.set(file, status.docId)
          failedFiles.push(file)
          failures.push(`${file.name} (${status.reason})`)
        }
      }

      if (failedFiles.length > 0) {
        // Keep only the failures selected, so a second submit retries those
        selectFiles(failedFiles)
        setFormStatus({
          kind: 'error',
          message: `Uploaded ${uploaded} of ${files.length}: failed ${failures.join('; ')}.`,
        })
      } else {
        setFormStatus({
          kind: 'success',
          message: `Uploaded ${files.length} photo${files.length === 1 ? '' : 's'}.`,
        })
        // Reset form
        selectFiles([])
        if (fileInputRef.current) fileInputRef.current.value = ''
        setTitle('')
        setCategory('')
        setDescription('')
        setLocation('')
        setProjectID('')
        setPhotoDate('')
      }
    } catch (error) {
      console.error(error)
      setFormStatus({ kind: 'error', message: 'Error uploading photos.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminGate>
      <div className={styles.AddPhoto}>
        <AdminNav />
        <div className={styles.content}>
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <label className={styles.fileInputLabel}>
              {previewUrls.length > 0 ? (
                <>
                  <span className='visually-hidden'>Choose images</span>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                    }}
                  >
                    {previewUrls.map((url, i) => (
                      // Deliberately a raw <img>. These are blob: URLs for
                      // files the admin just picked, so there is nothing for
                      // the image optimizer to fetch and no intrinsic size to
                      // give next/image. The preview never leaves this form.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={url}
                        alt={`Preview ${i + 1}`}
                        style={{
                          maxWidth: '100px',
                          maxHeight: '100px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : (
                'Choose images...'
              )}
              <input
                ref={fileInputRef}
                type='file'
                accept={ALLOWED_TYPES.join(',')}
                multiple
                aria-describedby='files-error'
                onChange={e => {
                  const picked = e.target.files
                    ? Array.from(e.target.files)
                    : []
                  const rejected: string[] = []
                  const accepted = picked.filter(file => {
                    if (!ALLOWED_TYPES.includes(file.type)) {
                      rejected.push(
                        `${file.name}: unsupported type (${file.type || 'unknown'})`
                      )
                      return false
                    }
                    if (file.size > MAX_FILE_MB * 1024 * 1024) {
                      rejected.push(
                        `${file.name}: too large (${(file.size / 1024 / 1024).toFixed(1)} MB, max ${MAX_FILE_MB} MB)`
                      )
                      return false
                    }
                    return true
                  })
                  setFileError(
                    rejected.length > 0
                      ? `Skipped ${rejected.length} file(s): ${rejected.join('; ')}`
                      : null
                  )
                  selectFiles(accepted)
                }}
              />
            </label>
            <div
              id='files-error'
              role='alert'
              aria-live='polite'
              className={styles.fieldError}
            >
              {fileError}
            </div>

            <label htmlFor='photo-title' className='visually-hidden'>
              Title (optional)
            </label>
            <input
              id='photo-title'
              type='text'
              placeholder='Title (optional)'
              value={title}
              onChange={e => setTitle(e.target.value)}
            />

            <label htmlFor='photo-date'>Date taken</label>
            <input
              id='photo-date'
              type='date'
              value={photoDate}
              onChange={e => {
                setPhotoDate(e.target.value)
                if (e.target.value) setDateError(null)
              }}
              aria-describedby='date-error'
            />
            <div
              id='date-error'
              role='alert'
              aria-live='polite'
              className={styles.fieldError}
            >
              {dateError}
            </div>

            <label htmlFor='photo-location' className='visually-hidden'>
              Location (optional)
            </label>
            <input
              id='photo-location'
              type='text'
              placeholder='Location (optional)'
              value={location}
              onChange={e => setLocation(e.target.value)}
            />

            <label htmlFor='photo-category' className='visually-hidden'>
              Category
            </label>
            <select
              id='photo-category'
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value=''>Select category (optional)</option>
              {categories.map((cat: CollectionType) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>

            <label htmlFor='photo-project' className='visually-hidden'>
              Project
            </label>
            <select
              id='photo-project'
              value={projectID}
              onChange={e => setProjectID(e.target.value)}
            >
              <option value=''>Select project (optional)</option>
              {projects.map((proj: ProjectType) => (
                <option key={proj.name} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>

            <label htmlFor='photo-description' className='visually-hidden'>
              Description (optional)
            </label>
            <textarea
              id='photo-description'
              placeholder='Description (optional)'
              value={description}
              onChange={e => setDescription(e.target.value)}
            />

            <button type='submit' disabled={loading}>
              {loading ? 'Uploading...' : 'Upload Photos'}
            </button>

            <div
              role='status'
              aria-live='polite'
              className={
                formStatus?.kind === 'error'
                  ? styles.formError
                  : styles.formSuccess
              }
            >
              {formStatus?.message}
            </div>
          </form>
        </div>
      </div>
    </AdminGate>
  )
}
