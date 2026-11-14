'use client'

import { useState, type FormEvent } from 'react'

import { resetDemoAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ResetForm() {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    const result = await resetDemoAction(password)
    setBusy(false)
    setMessage(result.ok ? { ok: true, text: result.summary } : { ok: false, text: result.error })
    if (result.ok) setPassword('')
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="demo-password">Demo password</Label>
        <Input id="demo-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
      </div>
      <Button type="submit" disabled={busy || !password} className="w-full">
        {busy ? 'Resetting… (about 30 seconds)' : 'Reset demo'}
      </Button>
      {message && <p className={`text-base ${message.ok ? 'text-clw-white' : 'text-red-400'}`}>{message.text}</p>}
    </form>
  )
}
