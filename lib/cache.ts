import fs from 'fs'
import path from 'path'
import { getCacheTtlHours, getApiToken } from './config'
import { fetchAllEffortEntities } from './productboard'
import { buildTree } from './transform'
import type { CacheStatus, EffortCacheFile } from '@/types/index'

const CACHE_PATH = path.join(process.cwd(), 'data', 'cache.json')

export function loadCache(): EffortCacheFile | null {
  try {
    const raw = fs.readFileSync(CACHE_PATH, 'utf-8')
    return JSON.parse(raw) as EffortCacheFile
  } catch {
    return null
  }
}

export function saveCache(data: EffortCacheFile): void {
  const dir = path.dirname(CACHE_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export function isCacheStale(cache: EffortCacheFile | null): boolean {
  if (!cache) return true
  const fetchedAt = new Date(cache.fetchedAt).getTime()
  const ttlMs = getCacheTtlHours() * 60 * 60 * 1000
  return Date.now() - fetchedAt > ttlMs
}

export function getCacheStatus(): CacheStatus {
  const cache = loadCache()
  if (!cache) return { fetchedAt: null, isStale: true, entityCounts: null }
  return {
    fetchedAt: cache.fetchedAt,
    isStale: isCacheStale(cache),
    entityCounts: {
      products: cache.products.length,
      components: cache.components.length,
      features: cache.features.length,
      releases: cache.releases.length,
    },
  }
}

export async function refreshCache(): Promise<EffortCacheFile> {
  const token = getApiToken()
  const { products, components, features, releases } = await fetchAllEffortEntities(token)
  const tree = buildTree({ fetchedAt: '', products, components, features, releases })

  // Validate tree built correctly (just for logging — not stored)
  void tree

  const cache: EffortCacheFile = {
    fetchedAt: new Date().toISOString(),
    products,
    components,
    features,
    releases,
  }

  saveCache(cache)
  return cache
}
