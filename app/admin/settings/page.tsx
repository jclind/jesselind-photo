'use client'

import React, { useState } from 'react'
import styles from '../page.module.scss'
import { reSerializePhotos } from '@/util/reSerializePhotos'
import { backfillBlurPlaceholders } from '@/util/backfillBlurPlaceholders'
import AdminNav from '../AdminNav'
import AdminGate from '@/components/AdminGate'

const SettingsPage = () => {
  const [backfillStatus, setBackfillStatus] = useState<string>('')
  const [reSerializeStatus, setReSerializeStatus] = useState<string>('')
  const [backfillRunning, setBackfillRunning] = useState(false)
  const [reSerializeRunning, setReSerializeRunning] = useState(false)
  const anyRunning = backfillRunning || reSerializeRunning

  const handleReSerializeClick = async () => {
    if (anyRunning) return
    setReSerializeRunning(true)
    setReSerializeStatus('Running…')
    try {
      const { count } = await reSerializePhotos()
      setReSerializeStatus(`Done. Renumbered ${count} photos.`)
    } catch (err) {
      console.error(err)
      setReSerializeStatus(`Error: ${(err as Error).message}`)
    } finally {
      setReSerializeRunning(false)
    }
  }

  const handleBackfillBlurs = async () => {
    if (anyRunning) return
    setBackfillRunning(true)
    setBackfillStatus('Running…')
    try {
      const { updated, skipped, failed } = await backfillBlurPlaceholders()
      setBackfillStatus(
        `Done. Updated ${updated}, skipped ${skipped}, failed ${failed}.`
      )
    } catch (err) {
      console.error(err)
      setBackfillStatus(`Error: ${(err as Error).message}`)
    } finally {
      setBackfillRunning(false)
    }
  }

  return (
    <AdminGate>
      <div className={styles.settingsPage}>
        <AdminNav />
        <div className={styles.buttons}>
          <button onClick={handleReSerializeClick} disabled={anyRunning}>
            Re-serialize Image Database
          </button>
          <button onClick={handleBackfillBlurs} disabled={anyRunning}>
            Backfill Blur Placeholders
          </button>
          {reSerializeStatus && <p>{reSerializeStatus}</p>}
          {backfillStatus && <p>{backfillStatus}</p>}
        </div>
      </div>
    </AdminGate>
  )
}

export default SettingsPage
