'use client'

import { useState } from 'react'
import type { CacheStatus } from '@/types/index'

function formatAge(fetchedAt: string): string {
  const diffMs = Date.now() - new Date(fetchedAt).getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}h ${minutes}m ago`
  return `${minutes}m ago`
}

export default function CacheStatusBar({ status }: { status: CacheStatus }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleRefresh() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/refresh', { method: 'POST' })
      const data = await res.json() as { ok: boolean; error?: string }
      if (data.ok) {
        setResult('Refreshed. Reload to see updated data.')
      } else {
        setResult(`Error: ${data.error}`)
      }
    } catch {
      setResult('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex items-center gap-3 text-sm rounded-lg px-4 py-2.5 mb-6 border"
      style={{ backgroundColor: 'var(--pb-blue-light)', borderColor: '#c7d9f8', color: 'var(--pb-blue)' }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: status.isStale ? 'var(--pb-yellow)' : '#22c55e' }}
      />
      {status.fetchedAt ? (
        <span>Last updated {formatAge(status.fetchedAt)}{status.isStale && ' — data may be stale'}</span>
      ) : (
        <span>No cache — data not yet fetched</span>
      )}
      {status.entityCounts && (
        <span className="text-xs opacity-60 ml-1">
          · {status.entityCounts.products} products · {status.entityCounts.components} components · {status.entityCounts.features} features · {status.entityCounts.releases} releases
        </span>
      )}
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="ml-auto font-semibold disabled:opacity-50 transition-opacity"
        style={{ color: 'var(--pb-blue-dark)' }}
      >
        {loading ? 'Refreshing…' : 'Refresh'}
      </button>
      {result && <span className="text-xs opacity-70">{result}</span>}
    </div>
  )
}
