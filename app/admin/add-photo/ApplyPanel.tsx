import React, { useState } from 'react'
import styles from './page.module.scss'
import { categories } from '@/data/categories'
import { parseManualDateTime } from './captureTime'
import { ApplyPatch, BatchItem } from './types'

// Which fields the user has edited since the selection last changed. Apply
// sends only these, so applying a category alone cannot also stamp a
// leftover location onto the whole selection. Date and time share one flag
// because they are applied together or not at all.
type Dirty = {
  location: boolean
  category: boolean
  dateTime: boolean
  title: boolean
  description: boolean
}

const CLEAN_DIRTY: Dirty = {
  location: false,
  category: false,
  dateTime: false,
  title: false,
  description: false,
}

// Which fields hold no single value because the selected photos disagree.
// Shown as a 'Mixed' placeholder until the field is edited.
type Mixed = {
  location: boolean
  category: boolean
  dateTime: boolean
}

type FieldValues = {
  location: string
  category: string
  title: string
  description: string
  date: string
  time: string
  mixed: Mixed
}

// The values the panel starts from: the photo's own when exactly one is
// selected, the value every selected photo shares when several are, and
// empty 'Mixed' fields where they disagree.
function syncValues(items: BatchItem[]): FieldValues {
  if (items.length === 0) {
    return {
      location: '',
      category: '',
      title: '',
      description: '',
      date: '',
      time: '',
      mixed: { location: false, category: false, dateTime: false },
    }
  }
  if (items.length === 1) {
    const item = items[0]
    const iso =
      item.captureMs != null ? new Date(item.captureMs).toISOString() : ''
    return {
      location: item.location,
      category: item.category,
      title: item.title,
      description: item.description,
      date: iso.slice(0, 10),
      time: iso.slice(11, 16),
      mixed: { location: false, category: false, dateTime: false },
    }
  }
  const shared = <T,>(get: (item: BatchItem) => T): T | undefined => {
    const first = get(items[0])
    return items.every(item => get(item) === first) ? first : undefined
  }
  const location = shared(item => item.location)
  const category = shared(item => item.category)
  const captureMs = shared(item => item.captureMs)
  const iso = captureMs != null ? new Date(captureMs).toISOString() : ''
  return {
    location: location ?? '',
    category: category ?? '',
    title: '',
    description: '',
    date: iso.slice(0, 10),
    time: iso.slice(11, 16),
    mixed: {
      location: location === undefined,
      category: category === undefined,
      dateTime: captureMs === undefined,
    },
  }
}

// Selects have no placeholder, so a disagreeing multi-selection shows this
// disabled option instead. Any real pick leaves it behind.
const MIXED_OPTION = '__mixed__'

type ApplyPanelProps = {
  selectedItems: BatchItem[]
  locations: string[]
  disabled: boolean
  onApply: (patch: ApplyPatch) => void
}

// The parent remounts this panel with a fresh key whenever the selected set
// changes, so its fields and dirty flags start clean per selection.
export default function ApplyPanel({
  selectedItems,
  locations,
  disabled,
  onApply,
}: ApplyPanelProps) {
  const [initial] = useState(() => syncValues(selectedItems))
  const [location, setLocation] = useState(initial.location)
  const [category, setCategory] = useState(initial.category)
  const [date, setDate] = useState(initial.date)
  const [time, setTime] = useState(initial.time)
  const [title, setTitle] = useState(initial.title)
  const [description, setDescription] = useState(initial.description)
  const [dirty, setDirty] = useState<Dirty>(CLEAN_DIRTY)
  const [mixed, setMixed] = useState<Mixed>(initial.mixed)
  const [error, setError] = useState<string | null>(null)

  const touch = (field: keyof Dirty) =>
    setDirty(d => (d[field] ? d : { ...d, [field]: true }))
  const unmix = (field: keyof Mixed) =>
    setMixed(m => (m[field] ? { ...m, [field]: false } : m))

  const locked = disabled || selectedItems.length === 0
  const count = selectedItems.length
  const plural = count === 1 ? 'photo' : 'photos'
  const anyDirty =
    dirty.location ||
    dirty.category ||
    dirty.dateTime ||
    dirty.title ||
    dirty.description

  // An edited-to-empty location or category is a deliberate clear, so it is
  // sent like any other edit.
  const apply = () => {
    setError(null)
    const patch: ApplyPatch = {}
    if (dirty.location) patch.location = location.trim()
    if (dirty.category) patch.category = category
    if (dirty.title) patch.title = title
    if (dirty.description) patch.description = description
    if (dirty.dateTime) {
      if (!date || !time) {
        setError('Enter both a date and a time.')
        return
      }
      const captureMs = parseManualDateTime(date, time)
      if (captureMs == null) {
        setError('That date or time is not valid.')
        return
      }
      patch.captureMs = captureMs
    }
    onApply(patch)
    setDirty(CLEAN_DIRTY)
  }

  return (
    <section className={styles.panel} aria-label='Apply to selection'>
      <h2 className={styles.panelTitle}>
        {count === 0 ? 'Apply to selection' : `Apply to ${count} ${plural}`}
      </h2>
      <p className={styles.panelHint}>
        {count === 0
          ? 'Select photos in the grid to edit them.'
          : selectedItems.length === 1
            ? 'Edits this photo.'
            : 'Changed fields are applied to every selected photo.'}
      </p>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Location</span>
        <input
          type='text'
          list='batch-locations'
          value={location}
          placeholder={mixed.location ? 'Mixed' : ''}
          disabled={locked}
          onChange={e => {
            setLocation(e.target.value)
            touch('location')
            unmix('location')
          }}
        />
      </label>
      <datalist id='batch-locations'>
        {locations.map(l => (
          <option key={l} value={l} />
        ))}
      </datalist>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Category</span>
        <select
          value={mixed.category && category === '' ? MIXED_OPTION : category}
          disabled={locked}
          onChange={e => {
            setCategory(e.target.value)
            touch('category')
            unmix('category')
          }}
        >
          {mixed.category && (
            <option value={MIXED_OPTION} disabled>
              Mixed
            </option>
          )}
          <option value=''>none</option>
          {categories.map(cat => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </label>
      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Date</span>
          <input
            type='date'
            value={date}
            placeholder={mixed.dateTime ? 'Mixed' : ''}
            disabled={locked}
            onChange={e => {
              setDate(e.target.value)
              touch('dateTime')
            }}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Time</span>
          <input
            type='time'
            value={time}
            placeholder={mixed.dateTime ? 'Mixed' : ''}
            disabled={locked}
            onChange={e => {
              setTime(e.target.value)
              touch('dateTime')
            }}
          />
        </label>
      </div>
      <p className={styles.panelNote}>
        Replaces the capture time. Use the local time where the photo was
        taken.
      </p>
      {selectedItems.length === 1 && (
        <>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Title</span>
            <input
              type='text'
              value={title}
              disabled={locked}
              onChange={e => {
                setTitle(e.target.value)
                touch('title')
              }}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Description</span>
            <textarea
              value={description}
              disabled={locked}
              onChange={e => {
                setDescription(e.target.value)
                touch('description')
              }}
            />
          </label>
        </>
      )}
      {error && (
        <p className={styles.fieldError} role='alert'>
          {error}
        </p>
      )}
      <button
        type='button'
        className={styles.applyButton}
        disabled={locked || !anyDirty}
        onClick={apply}
      >
        Apply
      </button>
    </section>
  )
}
