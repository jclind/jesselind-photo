'use client'

import React, { useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import styles from './AdminGate.module.scss'

type AuthStatus = 'loading' | 'unauthenticated' | 'unauthorized' | 'authorized'

export const logout = () => {
  signOut(auth)
}

const AdminGate = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        setStatus('unauthenticated')
        return
      }
      // Force-refresh so a freshly-granted custom claim is visible without
      // requiring the user to sign out and back in.
      const token = await user.getIdTokenResult(true)
      setStatus(token.claims.admin === true ? 'authorized' : 'unauthorized')
    })
    return unsubscribe
  }, [])

  const handleLogin = async () => {
    setError(null)
    setSubmitting(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      setError('Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') return null

  if (status === 'authorized') return <>{children}</>

  return (
    <div className={styles.adminGate}>
      <div className={styles.loginBox}>
        <h1>Admin Login</h1>
        <input
          type='email'
          placeholder='email'
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete='email'
        />
        <input
          type='password'
          placeholder='password'
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete='current-password'
          onKeyDown={e => {
            if (e.key === 'Enter') handleLogin()
          }}
        />
        {email.length > 0 && password.length > 0 && (
          <button onClick={handleLogin} disabled={submitting}>
            {submitting ? 'Logging in…' : 'Login'}
          </button>
        )}
        {error && <p>{error}</p>}
        {status === 'unauthorized' && (
          <p>This account is not authorized. <button onClick={logout}>Sign out</button></p>
        )}
      </div>
    </div>
  )
}

export default AdminGate
