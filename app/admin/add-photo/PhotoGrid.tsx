import React from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import styles from './page.module.scss'
import { BatchItem, DayGroup } from './types'

type PhotoGridProps = {
  groups: DayGroup[]
  total: number
  selected: Set<string>
  uploading: boolean
  onTileClick: (key: string, shift: boolean) => void
  onToggleDay: (keys: string[]) => void
  onSelectAll: () => void
  onClearSelection: () => void
  onRemove: (key: string) => void
}

export default function PhotoGrid({
  groups,
  total,
  selected,
  uploading,
  onTileClick,
  onToggleDay,
  onSelectAll,
  onClearSelection,
  onRemove,
}: PhotoGridProps) {
  return (
    <section className={styles.gridSection} aria-label='Photo batch'>
      <div className={styles.gridToolbar}>
        <span className={styles.gridCount}>
          {selected.size} of {total} selected
        </span>
        <div className={styles.gridToolbarButtons}>
          <button
            type='button'
            className={styles.smallButton}
            disabled={uploading}
            onClick={onSelectAll}
          >
            Select all
          </button>
          <button
            type='button'
            className={styles.smallButton}
            disabled={uploading}
            onClick={onClearSelection}
          >
            Clear
          </button>
        </div>
      </div>
      {groups.map(group => {
        const allSelected = group.items.every(item => selected.has(item.key))
        return (
          <div key={group.key} className={styles.dayGroup}>
            <header className={styles.dayHeader}>
              <h2 className={styles.dayTitle}>
                {group.label}
                <span className={styles.dayCount}>
                  {group.items.length}{' '}
                  {group.items.length === 1 ? 'photo' : 'photos'}
                </span>
              </h2>
              <button
                type='button'
                className={styles.smallButton}
                aria-pressed={allSelected}
                disabled={uploading}
                onClick={() => onToggleDay(group.items.map(item => item.key))}
              >
                {allSelected ? 'Deselect day' : 'Select day'}
              </button>
            </header>
            <ul className={styles.grid}>
              {group.items.map(item => (
                <Tile
                  key={item.key}
                  item={item}
                  selected={selected.has(item.key)}
                  uploading={uploading}
                  onClick={onTileClick}
                  onRemove={onRemove}
                />
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )
}

type TileProps = {
  item: BatchItem
  selected: boolean
  uploading: boolean
  onClick: (key: string, shift: boolean) => void
  onRemove: (key: string) => void
}

function Tile({ item, selected, uploading, onClick, onRemove }: TileProps) {
  const meta = [item.location, item.category].filter(Boolean).join(' · ')
  return (
    <li className={styles.cell}>
      <div className={styles.cellFrame}>
        <button
          type='button'
          className={`${styles.tile} ${selected ? styles.tileSelected : ''}`}
          aria-pressed={selected}
          disabled={uploading}
          onClick={e => onClick(item.key, e.shiftKey)}
        >
          {item.previewUrl ? (
            <>
              {/* Deliberately a raw <img>: a blob: preview of a file the
                  admin just picked, so there is nothing for the image
                  optimizer to fetch and no intrinsic size to give
                  next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.previewUrl} alt={item.file.name} loading='lazy' />
            </>
          ) : (
            /* Neutral stand-in until the preview is generated */
            <div className={styles.tilePlaceholder} aria-hidden='true' />
          )}
        </button>
        {!uploading && (
          <button
            type='button'
            className={styles.removeButton}
            aria-label={`Remove ${item.file.name}`}
            onClick={() => onRemove(item.key)}
          >
            <X size={14} strokeWidth={2} aria-hidden='true' />
          </button>
        )}
      </div>
      <TileBadge item={item} />
      <p className={styles.cellMeta}>{meta || ' '}</p>
    </li>
  )
}

function TileBadge({ item }: { item: BatchItem }) {
  const { status } = item
  if (status.state === 'ready' && item.alreadyUploaded) {
    return (
      <span className={`${styles.badge} ${styles.badgeMuted}`}>
        already uploaded
      </span>
    )
  }
  switch (status.state) {
    case 'ready':
      if (item.captureMs == null) {
        return (
          <span className={`${styles.badge} ${styles.badgeWarn}`}>
            needs date
          </span>
        )
      }
      return null
    case 'queued':
      return (
        <span className={`${styles.badge} ${styles.badgeMuted}`}>queued</span>
      )
    case 'uploading':
      return (
        <span className={`${styles.badge} ${styles.badgeActive}`}>
          uploading…
        </span>
      )
    case 'done':
      return (
        <span className={`${styles.badge} ${styles.badgeDone}`}>
          done{' '}
          <Link
            href={`/all-photos/${status.id}`}
            target='_blank'
            rel='noopener noreferrer'
          >
            view
          </Link>
        </span>
      )
    case 'failed':
      return (
        <span
          className={`${styles.badge} ${styles.badgeFail}`}
          title={status.reason}
        >
          failed: {status.reason}
        </span>
      )
  }
}
