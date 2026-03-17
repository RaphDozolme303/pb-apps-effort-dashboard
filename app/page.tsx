export const dynamic = 'force-dynamic'

import { isApiKeyConfigured } from '@/lib/config'
import { loadCache, getCacheStatus } from '@/lib/cache'
import { buildTree } from '@/lib/transform'
import ConnectPanel from '@/components/ConnectPanel'
import CacheStatusBar from '@/components/CacheStatusBar'
import EffortTree from '@/components/EffortTree'

export default function HomePage() {
  // Show connect screen if no API key is set
  if (!isApiKeyConfigured()) {
    return <ConnectPanel />
  }

  const cache = loadCache()
  const status = getCacheStatus()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--pb-blue)' }}>
        Effort by Product
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Aggregated feature effort across products, components and releases.
      </p>

      <CacheStatusBar status={status} />

      {!cache ? (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: 'var(--pb-blue-light)', color: 'var(--pb-blue)' }}
        >
          No data cached yet — click <strong>Refresh</strong> above to fetch from Productboard.
        </div>
      ) : (
        <EffortTree
          tree={buildTree(cache)}
          releases={cache.releases}
        />
      )}
    </div>
  )
}
