import React from 'react'
import styles from './page.module.scss'
import { projects } from '@/data/projects'

type UploadBarProps = {
  projectID: string
  onProjectChange: (projectID: string) => void
  uploading: boolean
  queueLength: number
  canUpload: boolean
  blockedMessage: string | null
  orderCheckFailed: boolean
  outOfOrder: { count: number; newest: Date } | null
  acknowledged: boolean
  onAcknowledge: (value: boolean) => void
  onUpload: () => void
  failures: { name: string; reason: string }[]
  allSettled: boolean
  onNewBatch: () => void
  summary: { done: number; failed: number; skipped: number }
  progress: { processed: number; total: number } | null
}

export default function UploadBar({
  projectID,
  onProjectChange,
  uploading,
  queueLength,
  canUpload,
  blockedMessage,
  orderCheckFailed,
  outOfOrder,
  acknowledged,
  onAcknowledge,
  onUpload,
  failures,
  allSettled,
  onNewBatch,
  summary,
  progress,
}: UploadBarProps) {
  return (
    <section className={styles.uploadBar} aria-label='Upload'>
      <label className={styles.projectField}>
        <span className={styles.fieldLabel}>Project (whole batch)</span>
        <select
          value={projectID}
          disabled={uploading}
          onChange={e => onProjectChange(e.target.value)}
        >
          <option value=''>No project</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      {blockedMessage && (
        <p className={styles.blockMessage} role='alert'>
          {blockedMessage}
        </p>
      )}

      {orderCheckFailed && !outOfOrder && (
        <p className={styles.orderCheckNote}>
          Could not check the newest photo on the site, so date order was not
          verified.
        </p>
      )}

      {outOfOrder && (
        <div className={styles.outOfOrder}>
          <p>
            {outOfOrder.count}{' '}
            {outOfOrder.count === 1 ? 'photo is' : 'photos are'} earlier than
            the newest photo on the site (
            {outOfOrder.newest.toISOString().slice(0, 10)}), so{' '}
            {outOfOrder.count === 1 ? 'it will' : 'they will'} appear out of
            date order, and re-serializing would renumber the ids of existing
            photos.
          </p>
          <label className={styles.ackLabel}>
            <input
              type='checkbox'
              checked={acknowledged}
              onChange={e => onAcknowledge(e.target.checked)}
            />
            I understand
          </label>
        </div>
      )}

      {projectID === '' && queueLength > 0 && !blockedMessage && !allSettled && (
        <p className={styles.noProjectNote}>
          No project selected. These photos will not appear in any project.
        </p>
      )}

      {failures.length > 0 && (
        <p className={styles.failMessage} role='alert'>
          Upload stopped at {failures[0].name} ({failures[0].reason}). Resume
          retries it, or remove it from the batch.
        </p>
      )}

      <div className={styles.uploadActions}>
        {!allSettled && (
          <button
            type='button'
            className={`${styles.button} ${styles.primaryButton}`}
            disabled={!canUpload}
            onClick={onUpload}
          >
            {uploading
              ? 'Uploading…'
              : failures.length > 0
                ? `Resume upload (${queueLength})`
                : `Upload ${queueLength} ${
                    queueLength === 1 ? 'photo' : 'photos'
                  }`}
          </button>
        )}
        {allSettled && (
          <button
            type='button'
            className={styles.button}
            disabled={uploading}
            onClick={onNewBatch}
          >
            Start new batch
          </button>
        )}
      </div>

      {progress ? (
        <p className={styles.summary} role='status'>
          Uploading {progress.processed} of {progress.total}…
        </p>
      ) : (
        summary.done + summary.failed + summary.skipped > 0 && (
          <p className={styles.summary} role='status'>
            {summary.done} done, {summary.failed} failed, {summary.skipped}{' '}
            skipped
          </p>
        )
      )}
    </section>
  )
}
