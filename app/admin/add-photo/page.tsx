'use client'

import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import styles from './page.module.scss'
import AdminNav from '../AdminNav'
import AdminGate from '@/components/AdminGate'
import DropZone, { ALLOWED_TYPES, MAX_FILE_MB } from './DropZone'
import PhotoGrid from './PhotoGrid'
import ApplyPanel from './ApplyPanel'
import UploadBar from './UploadBar'
import { readCaptureTime } from './captureTime'
import { generatePreviewUrl } from './previews'
import {
  fetchNewestPhotoDate,
  fetchProjectUploads,
  sanitizeFileName,
  uploadPhoto,
  PhotoUploadStatus,
  ProjectUpload,
} from '@/util/uploadPhotos'
import { ApplyPatch, BatchItem, DayGroup } from './types'

type State = {
  items: BatchItem[]
  selected: Set<string>
  anchorKey: string | null
  projectID: string
  rejected: string[]
  uploading: boolean
  exifPending: number
}

type Action =
  | { type: 'add'; items: BatchItem[]; rejected: string[] }
  | { type: 'parsed'; key: string; captureMs: number | null }
  | { type: 'preview'; key: string; url: string }
  | { type: 'remove'; key: string }
  | { type: 'tileClick'; key: string; shift: boolean; orderedKeys: string[] }
  | { type: 'setSelected'; keys: string[] | null }
  | { type: 'toggleDay'; keys: string[] }
  | { type: 'apply'; keys: string[]; patch: ApplyPatch }
  | { type: 'setProject'; projectID: string }
  | { type: 'duplicates'; uploads: ProjectUpload[] }
  | { type: 'beginRun'; keys: string[] }
  | { type: 'setStatus'; key: string; status: PhotoUploadStatus }
  | { type: 'resetQueued' }
  | { type: 'finishRun' }
  | { type: 'reset' }

const initialState: State = {
  items: [],
  selected: new Set(),
  anchorKey: null,
  projectID: '',
  rejected: [],
  uploading: false,
  exifPending: 0,
}

// Batch item keys only need to be unique within this page. Not
// crypto.randomUUID, which is missing over plain http on a non-localhost
// host (the dev server reached over the tailnet).
let nextItemKey = 0

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add':
      return {
        ...state,
        items: [...state.items, ...action.items],
        rejected: [...state.rejected, ...action.rejected],
        exifPending: state.exifPending + action.items.length,
      }
    case 'parsed':
      return {
        ...state,
        items: state.items.map(item =>
          item.key === action.key && !item.dateEdited
            ? { ...item, captureMs: action.captureMs }
            : item
        ),
        exifPending: Math.max(0, state.exifPending - 1),
      }
    case 'preview':
      return {
        ...state,
        items: state.items.map(item =>
          item.key === action.key ? { ...item, previewUrl: action.url } : item
        ),
      }
    case 'remove': {
      const selected = new Set(state.selected)
      selected.delete(action.key)
      return {
        ...state,
        items: state.items.filter(item => item.key !== action.key),
        selected,
        anchorKey: state.anchorKey === action.key ? null : state.anchorKey,
      }
    }
    case 'tileClick': {
      const selected = new Set(state.selected)
      if (action.shift && state.anchorKey) {
        const from = action.orderedKeys.indexOf(state.anchorKey)
        const to = action.orderedKeys.indexOf(action.key)
        if (from !== -1 && to !== -1) {
          const range = action.orderedKeys.slice(
            Math.min(from, to),
            Math.max(from, to) + 1
          )
          range.forEach(key => selected.add(key))
          return { ...state, selected }
        }
      }
      if (selected.has(action.key)) selected.delete(action.key)
      else selected.add(action.key)
      return { ...state, selected, anchorKey: action.key }
    }
    case 'setSelected':
      return { ...state, selected: new Set(action.keys ?? []), anchorKey: null }
    case 'toggleDay': {
      const selected = new Set(state.selected)
      const allSelected = action.keys.every(key => selected.has(key))
      action.keys.forEach(key =>
        allSelected ? selected.delete(key) : selected.add(key)
      )
      return { ...state, selected }
    }
    case 'apply': {
      const keys = new Set(action.keys)
      return {
        ...state,
        items: state.items.map(item =>
          keys.has(item.key)
            ? {
                ...item,
                ...action.patch,
                dateEdited: item.dateEdited || 'captureMs' in action.patch,
              }
            : item
        ),
      }
    }
    case 'setProject':
      return { ...state, projectID: action.projectID }
    case 'duplicates': {
      let changed = false
      const items = state.items.map(item => {
        const alreadyUploaded =
          item.status.state === 'ready' && matchesUpload(item, action.uploads)
        if (alreadyUploaded === item.alreadyUploaded) return item
        changed = true
        return { ...item, alreadyUploaded }
      })
      return changed ? { ...state, items } : state
    }
    case 'beginRun': {
      const keys = new Set(action.keys)
      return {
        ...state,
        uploading: true,
        items: state.items.map(item =>
          keys.has(item.key) ? { ...item, status: { state: 'queued' } } : item
        ),
      }
    }
    // retryDocId follows the outcome: a failure with a docId records it for
    // the next attempt, and done clears it.
    case 'setStatus': {
      const { status } = action
      return {
        ...state,
        items: state.items.map(item => {
          if (item.key !== action.key) return item
          const retryDocId =
            status.state === 'failed' && status.docId
              ? status.docId
              : status.state === 'done'
                ? null
                : item.retryDocId
          return { ...item, status, retryDocId }
        }),
      }
    }
    // An aborted run must leave the photos it never reached in their prior
    // state, so anything it had marked queued goes back to ready.
    case 'resetQueued':
      return {
        ...state,
        items: state.items.map(item =>
          item.status.state === 'queued'
            ? { ...item, status: { state: 'ready' } }
            : item
        ),
      }
    case 'finishRun':
      return { ...state, uploading: false }
    case 'reset':
      return initialState
  }
}

// A picked file duplicates an existing upload only when capture second and
// sanitized filename both match (same rule as the upload engine).
function matchesUpload(item: BatchItem, uploads: ProjectUpload[]): boolean {
  if (item.captureMs == null) return false
  const safeName = sanitizeFileName(item.file.name)
  const seconds = Math.floor(item.captureMs / 1000)
  return uploads.some(
    upload => upload.seconds === seconds && upload.safeName === safeName
  )
}

// Display order: undated photos first, then capture time ascending with ties
// by filename. The upload loop follows the same order.
function orderItems(items: BatchItem[]): BatchItem[] {
  return [...items].sort((a, b) => {
    if (a.captureMs == null && b.captureMs == null)
      return a.file.name.localeCompare(b.file.name)
    if (a.captureMs == null) return -1
    if (b.captureMs == null) return 1
    if (a.captureMs !== b.captureMs) return a.captureMs - b.captureMs
    return a.file.name.localeCompare(b.file.name)
  })
}

const DAY_LABEL = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

// Groups the display-ordered items by UTC calendar day, undated first.
function groupByDay(ordered: BatchItem[]): DayGroup[] {
  const groups: DayGroup[] = []
  const byKey = new Map<string, DayGroup>()
  for (const item of ordered) {
    const date = item.captureMs != null ? new Date(item.captureMs) : null
    const key = date ? date.toISOString().slice(0, 10) : 'needs-date'
    let group = byKey.get(key)
    if (!group) {
      group = {
        key,
        label: date ? DAY_LABEL.format(date) : 'Needs a date',
        items: [],
      }
      byKey.set(key, group)
      groups.push(group)
    }
    group.items.push(item)
  }
  return groups
}

export default function AddPhoto() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [acknowledged, setAcknowledged] = useState(false)
  const [newest, setNewest] = useState<{
    state: 'idle' | 'loading' | 'done' | 'error'
    value: Date | null
  }>({ state: 'idle', value: null })
  // The duplicate check's last result, keyed to the project and batch it ran
  // for. A result for any other project or batch counts as still loading.
  const [dupCheck, setDupCheck] = useState<{
    state: 'loading' | 'done' | 'error'
    projectID: string
    batchKey: string
  } | null>(null)
  const [dupRetry, setDupRetry] = useState(0)
  const [progress, setProgress] = useState<{
    processed: number
    total: number
  } | null>(null)
  // Guards a second run starting before the uploading state re-renders
  const runningRef = useRef(false)
  const itemsRef = useRef(state.items)
  // Previews run one at a time through this chain, so only one full-size
  // decode is in memory. Keys removed before their preview finished are
  // skipped or revoked by the jobs themselves.
  const previewQueueRef = useRef<Promise<void>>(Promise.resolve())
  const removedKeysRef = useRef(new Set<string>())

  useEffect(() => {
    itemsRef.current = state.items
  }, [state.items])

  // Object URLs are revoked here rather than derived in an effect, so every
  // URL has exactly one revoke even when items change mid-batch. Marking
  // every key removed makes queued preview jobs skip and in-flight ones
  // revoke the URL they were about to store.
  useEffect(() => {
    const removedKeys = removedKeysRef.current
    return () =>
      itemsRef.current.forEach(item => {
        removedKeys.add(item.key)
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
  }, [])

  // Warn before leaving mid-upload
  useEffect(() => {
    if (!state.uploading) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [state.uploading])

  // Keep an accidental drop outside the zone from navigating the page away
  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault()
    window.addEventListener('dragover', prevent)
    window.addEventListener('drop', prevent)
    return () => {
      window.removeEventListener('dragover', prevent)
      window.removeEventListener('drop', prevent)
    }
  }, [])

  const orderedItems = useMemo(() => orderItems(state.items), [state.items])
  const orderedKeys = useMemo(
    () => orderedItems.map(item => item.key),
    [orderedItems]
  )
  const groups = useMemo(() => groupByDay(orderedItems), [orderedItems])
  const selectedItems = useMemo(
    () => orderedItems.filter(item => state.selected.has(item.key)),
    [orderedItems, state.selected]
  )
  // Sorted so it changes only when the selected set itself changes, not on
  // an EXIF reorder. As the panel's key it remounts the panel per
  // selection, resetting its fields and dirty flags.
  const selectionKey = useMemo(
    () => [...state.selected].sort().join('|'),
    [state.selected]
  )
  const locations = useMemo(
    () => [
      ...new Set(
        state.items.map(item => item.location.trim()).filter(Boolean)
      ),
    ],
    [state.items]
  )

  const pending = useMemo(
    () =>
      orderedItems.filter(
        item =>
          (item.status.state === 'ready' || item.status.state === 'failed') &&
          !item.alreadyUploaded
      ),
    [orderedItems]
  )
  const queue = useMemo(
    () => pending.filter(item => item.captureMs != null),
    [pending]
  )
  const needsDateCount = pending.length - queue.length
  const failedItems = useMemo(
    () => orderedItems.filter(item => item.status.state === 'failed'),
    [orderedItems]
  )
  const failures = useMemo(
    () =>
      failedItems.map(item => ({
        name: item.file.name,
        reason: item.status.state === 'failed' ? item.status.reason : '',
      })),
    [failedItems]
  )
  const summary = useMemo(
    () => ({
      done: state.items.filter(item => item.status.state === 'done').length,
      failed: failedItems.length,
      skipped: state.items.filter(
        item => item.alreadyUploaded && item.status.state === 'ready'
      ).length,
    }),
    [state.items, failedItems]
  )
  const allSettled =
    state.items.length > 0 &&
    state.items.every(
      item =>
        item.status.state === 'done' ||
        (item.alreadyUploaded && item.status.state === 'ready')
    )

  const outOfOrder = useMemo(() => {
    if (newest.state !== 'done' || !newest.value) return null
    const cutoff = newest.value.getTime()
    const earlier = queue.filter(item => (item.captureMs ?? Infinity) < cutoff)
    return earlier.length > 0
      ? { count: earlier.length, newest: newest.value }
      : null
  }, [newest, queue])

  // Re-check duplicates whenever the project or the batch changes, once EXIF
  // parsing has settled (capture seconds are part of the match)
  const itemsKey = useMemo(
    () => state.items.map(item => `${item.key}:${item.captureMs ?? '-'}`).join('|'),
    [state.items]
  )
  const dupState = !state.projectID
    ? 'not-needed'
    : dupCheck &&
        dupCheck.projectID === state.projectID &&
        dupCheck.batchKey === itemsKey
      ? dupCheck.state
      : 'loading'
  // Idle counts as loading: the first fetch starts as soon as any photo has
  // a date, and the queue is empty until then.
  const orderLoading = newest.state === 'idle' || newest.state === 'loading'
  const orderCheckFailed = newest.state === 'error'

  const canUpload =
    !state.uploading &&
    queue.length > 0 &&
    needsDateCount === 0 &&
    (dupState === 'not-needed' || dupState === 'done') &&
    !orderLoading &&
    (!(outOfOrder || orderCheckFailed) || acknowledged)

  const blockedMessage =
    needsDateCount > 0
      ? `${needsDateCount} ${
          needsDateCount === 1 ? 'photo needs' : 'photos need'
        } a date before upload. Select ${
          needsDateCount === 1 ? 'it' : 'them'
        } and apply a date and time, or remove ${
          needsDateCount === 1 ? 'it' : 'them'
        }.`
      : null
  const checkingMessage =
    state.uploading || queue.length === 0 || blockedMessage
      ? null
      : dupState === 'loading'
        ? 'Checking for photos already in this project…'
        : orderLoading
          ? 'Checking date order…'
          : null

  // Fetch the site's newest photoDate for the out-of-order warning: once per
  // batch when the first EXIF date lands, and again after every upload run
  // so the check reflects what was just uploaded.
  const refreshNewest = useCallback(() => {
    fetchNewestPhotoDate()
      .then(value => setNewest({ state: 'done', value }))
      .catch(err => {
        console.error('Could not fetch newest photoDate:', err)
        setNewest({ state: 'error', value: null })
      })
  }, [])
  // The ref (not a loading state) keeps the first fetch single while the
  // EXIF dates trickle in.
  const newestFetchedRef = useRef(false)
  const hasDated = state.items.some(item => item.captureMs != null)
  useEffect(() => {
    if (!hasDated || newestFetchedRef.current) return
    newestFetchedRef.current = true
    refreshNewest()
  }, [hasDated, refreshNewest])

  const exifSettled = state.exifPending === 0
  useEffect(() => {
    if (state.items.length === 0 || !exifSettled) return
    if (!state.projectID) {
      dispatch({ type: 'duplicates', uploads: [] })
      return
    }
    const projectID = state.projectID
    const batchKey = itemsKey
    let cancelled = false
    fetchProjectUploads(projectID)
      .then(uploads => {
        if (cancelled) return
        dispatch({ type: 'duplicates', uploads })
        setDupCheck({ state: 'done', projectID, batchKey })
      })
      .catch(err => {
        console.error('Could not check existing project uploads:', err)
        if (!cancelled) setDupCheck({ state: 'error', projectID, batchKey })
      })
    return () => {
      cancelled = true
    }
  }, [state.items.length, state.projectID, itemsKey, exifSettled, dupRetry])

  const retryDuplicateCheck = () => {
    setDupCheck({
      state: 'loading',
      projectID: state.projectID,
      batchKey: itemsKey,
    })
    setDupRetry(n => n + 1)
  }

  // One preview at a time, because each job decodes a full camera file and
  // a large batch of those at once would exhaust memory. A generation
  // failure falls back to the file's own object URL.
  const enqueuePreview = (key: string, file: File) => {
    const run = async () => {
      if (removedKeysRef.current.has(key)) return
      let url: string
      try {
        url = await generatePreviewUrl(file)
      } catch (err) {
        console.error(`Preview generation failed for ${file.name}:`, err)
        url = URL.createObjectURL(file)
      }
      if (removedKeysRef.current.has(key)) {
        URL.revokeObjectURL(url)
        return
      }
      dispatch({ type: 'preview', key, url })
    }
    previewQueueRef.current = previewQueueRef.current.then(run, run)
  }

  const addFiles = (files: File[]) => {
    if (state.uploading) return
    const accepted: BatchItem[] = []
    const rejected: string[] = []
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        rejected.push(`${file.name}: unsupported type (${file.type || 'unknown'})`)
        continue
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        rejected.push(
          `${file.name}: too large (${(file.size / 1024 / 1024).toFixed(1)} MB, max ${MAX_FILE_MB} MB)`
        )
        continue
      }
      const duplicate = state.items.some(
        item =>
          item.file.name === file.name &&
          item.file.size === file.size &&
          item.file.lastModified === file.lastModified
      )
      if (duplicate) continue
      accepted.push({
        key: `item-${nextItemKey++}`,
        file,
        previewUrl: null,
        captureMs: null,
        dateEdited: false,
        location: '',
        category: '',
        title: '',
        description: '',
        alreadyUploaded: false,
        status: { state: 'ready' },
        retryDocId: null,
      })
    }
    if (accepted.length === 0 && rejected.length === 0) return
    dispatch({ type: 'add', items: accepted, rejected })
    for (const item of accepted) {
      enqueuePreview(item.key, item.file)
      readCaptureTime(item.file).then(captureMs =>
        dispatch({ type: 'parsed', key: item.key, captureMs })
      )
    }
  }

  const removeItem = (key: string) => {
    if (state.uploading) return
    const item = state.items.find(i => i.key === key)
    removedKeysRef.current.add(key)
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
    dispatch({ type: 'remove', key })
  }

  const handleTileClick = (key: string, shift: boolean) => {
    if (state.uploading) return
    dispatch({ type: 'tileClick', key, shift, orderedKeys })
  }

  const handleApply = (patch: ApplyPatch) => {
    if (state.uploading) return
    // Uploaded photos are already in Firestore; editing them here would change
    // nothing on the site, so they are left out.
    const keys = state.items
      .filter(
        item =>
          state.selected.has(item.key) &&
          (item.status.state === 'ready' || item.status.state === 'failed')
      )
      .map(item => item.key)
    dispatch({ type: 'apply', keys, patch })
    // Clearing the selection after apply saves scrolling back to the toolbar
    dispatch({ type: 'setSelected', keys: null })
  }

  const runUpload = async (batch: BatchItem[]) => {
    if (runningRef.current || batch.length === 0) return
    runningRef.current = true
    dispatch({ type: 'beginRun', keys: batch.map(item => item.key) })
    setProgress({ processed: 0, total: batch.length })
    // Strictly sequential: awaiting each upload in display order is what
    // keeps sequenceNumber aligned with capture order. The run stops at the
    // first failure so the photos after it keep their places in line for
    // the resume.
    for (const item of batch) {
      const captureMs = item.captureMs
      if (captureMs == null) continue
      dispatch({
        type: 'setStatus',
        key: item.key,
        status: { state: 'uploading' },
      })
      // A failed photo reuses its docId so a retry lands on the same
      // Storage objects. It comes from retryDocId, which survives the status
      // resets of later runs.
      const docId = item.retryDocId ?? undefined
      let status: PhotoUploadStatus
      try {
        status = await uploadPhoto(
          item.file,
          {
            title: item.title,
            category: item.category,
            description: item.description,
            location: item.location.trim() || null,
            projectID: state.projectID || null,
            photoDate: new Date(captureMs),
          },
          { docId }
        )
      } catch (err) {
        // uploadPhoto only throws on an invalid photoDate
        console.error(err)
        status = { state: 'failed', reason: 'invalid date', docId: '' }
      }
      dispatch({ type: 'setStatus', key: item.key, status })
      setProgress(p => (p ? { ...p, processed: p.processed + 1 } : p))
      if (status.state === 'failed') break
    }
    dispatch({ type: 'resetQueued' })
    dispatch({ type: 'finishRun' })
    setProgress(null)
    runningRef.current = false
    // The out-of-order check has to reflect what just uploaded, so fetch
    // the newest photoDate again and clear the acknowledgment; a remaining
    // queue that is now backdated has to be re-acknowledged.
    setAcknowledged(false)
    setNewest(n => ({ state: 'loading', value: n.value }))
    refreshNewest()
  }

  const handleUpload = () => {
    if (!canUpload) return
    void runUpload(queue)
  }

  const handleNewBatch = () => {
    if (state.uploading) return
    state.items.forEach(item => {
      removedKeysRef.current.add(item.key)
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    })
    dispatch({ type: 'reset' })
    setAcknowledged(false)
    setNewest({ state: 'idle', value: null })
    newestFetchedRef.current = false
    setProgress(null)
  }

  return (
    <AdminGate>
      <div className={styles.AddPhoto}>
        <AdminNav />
        <main className={styles.content}>
          <h1 className={styles.pageTitle}>Add photos</h1>
          <DropZone
            disabled={state.uploading}
            onFiles={addFiles}
            rejected={state.rejected}
          />
          {state.items.length > 0 && (
            <>
              <div className={styles.layout}>
                <PhotoGrid
                  groups={groups}
                  total={state.items.length}
                  selected={state.selected}
                  uploading={state.uploading}
                  onTileClick={handleTileClick}
                  onToggleDay={keys => {
                    if (!state.uploading) dispatch({ type: 'toggleDay', keys })
                  }}
                  onSelectAll={() => {
                    if (!state.uploading)
                      dispatch({ type: 'setSelected', keys: orderedKeys })
                  }}
                  onClearSelection={() => {
                    if (!state.uploading)
                      dispatch({ type: 'setSelected', keys: null })
                  }}
                  onRemove={removeItem}
                />
                <ApplyPanel
                  key={selectionKey}
                  selectedItems={selectedItems}
                  locations={locations}
                  disabled={state.uploading}
                  onApply={handleApply}
                />
              </div>
              <UploadBar
                projectID={state.projectID}
                onProjectChange={projectID =>
                  dispatch({ type: 'setProject', projectID })
                }
                uploading={state.uploading}
                queueLength={queue.length}
                canUpload={canUpload}
                blockedMessage={blockedMessage}
                checkingMessage={checkingMessage}
                duplicateCheckFailed={dupState === 'error'}
                onRetryDuplicateCheck={retryDuplicateCheck}
                orderCheckFailed={orderCheckFailed}
                outOfOrder={outOfOrder}
                acknowledged={acknowledged}
                onAcknowledge={setAcknowledged}
                onUpload={handleUpload}
                failures={failures}
                allSettled={allSettled}
                onNewBatch={handleNewBatch}
                summary={summary}
                progress={progress}
              />
            </>
          )}
        </main>
      </div>
    </AdminGate>
  )
}
