'use client'

import { useState } from 'react'

export default function ConnectPanel() {
  const [token, setToken] = useState('')
  const [step, setStep] = useState<'idle' | 'saving' | 'fetching' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    if (!token.trim()) return
    setStep('saving')
    setError(null)

    try {
      // Save the API key
      const saveRes = await fetch('/api/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      })
      const saveData = await saveRes.json() as { ok: boolean; error?: string }
      if (!saveData.ok) {
        setError(saveData.error ?? 'Failed to save token')
        setStep('error')
        return
      }

      // Trigger initial cache refresh
      setStep('fetching')
      const refreshRes = await fetch('/api/refresh', { method: 'POST' })
      const refreshData = await refreshRes.json() as { ok: boolean; error?: string }
      if (!refreshData.ok) {
        setError(refreshData.error ?? 'Failed to fetch data')
        setStep('error')
        return
      }

      // Reload to show the tree
      window.location.reload()
    } catch {
      setError('Network error — please try again.')
      setStep('error')
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-slate-200 p-8">
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--pb-blue)' }}>
            Connect your Productboard workspace
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Enter your Productboard API token to fetch effort data. The token is stored locally and never sent anywhere except Productboard.
          </p>

          <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1.5">
            API Token
          </label>
          <input
            id="token"
            type="password"
            placeholder="pb_..."
            value={token}
            onChange={(e) => { setToken(e.target.value); setError(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleConnect() }}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--pb-blue)] mb-4"
          />

          {error && (
            <div className="text-sm text-red-600 mb-4 p-3 rounded bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={!token.trim() || step === 'saving' || step === 'fetching'}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: 'var(--pb-blue)' }}
          >
            {step === 'saving' && 'Saving token…'}
            {step === 'fetching' && 'Fetching data from Productboard…'}
            {(step === 'idle' || step === 'error') && 'Connect'}
          </button>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Find your API token in Productboard → Settings → Integrations → API Access.
          </p>
        </div>
      </div>
    </div>
  )
}
