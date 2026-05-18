'use client'

import React, { useState } from 'react'
import styles from '../page.module.scss'
import { reSerializePhotos } from '@/util/reSerializePhotos'
import { backfillBlurPlaceholders } from '@/util/backfillBlurPlaceholders'
import AdminNav from '../AdminNav'
import AdminGate from '@/components/AdminGate'

const SettingsPage = () => {
  const [backfillStatus, setBackfillStatus] = useState<string>('')

  const handleReSerializeClick = () => {
    reSerializePhotos()
  }

  const handleBackfillBlurs = async () => {
    setBackfillStatus('Running…')
    try {
      const { updated, skipped, failed } = await backfillBlurPlaceholders()
      setBackfillStatus(
        `Done. Updated ${updated}, skipped ${skipped}, failed ${failed}.`
      )
    } catch (err) {
      console.error(err)
      setBackfillStatus(`Error: ${(err as Error).message}`)
    }
  }

  return (
    <AdminGate>
      <div className={styles.settingsPage}>
        <AdminNav />
        <div className={styles.buttons}>
          <button onClick={handleReSerializeClick}>
            Re-serialize Image Database
          </button>
          <button onClick={handleBackfillBlurs}>
            Backfill Blur Placeholders
          </button>
          {backfillStatus && <p>{backfillStatus}</p>}
        </div>
      </div>
    </AdminGate>
  )
}

export default SettingsPage
