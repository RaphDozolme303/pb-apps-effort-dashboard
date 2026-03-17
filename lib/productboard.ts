import { PB_API_BASE } from './config'
import type { EffortEntity, PBApiEntity, PBApiPage } from '@/types/index'

const EFFORT_TYPES = new Set<string>(['product', 'component', 'feature', 'release'])

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function pbFetch<T>(url: string, token: string, retried = false): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  })

  if (res.status === 429 && !retried) {
    await sleep(1000)
    return pbFetch<T>(url, token, true)
  }

  if (!res.ok) {
    throw new Error(`Productboard API error ${res.status}: ${await res.text()}`)
  }

  return res.json() as Promise<T>
}

function extractParentAndReleases(entity: PBApiEntity): {
  parentId: string | null
  releaseIds: string[]
} {
  const rels = entity.relationships?.data ?? []

  if (entity.type === 'component') {
    // component parent is a product or another component
    const parent =
      rels.find((r) => (r.type === 'link' || r.type === 'parent') && r.target.type === 'product') ??
      rels.find((r) => (r.type === 'link' || r.type === 'parent') && r.target.type === 'component')
    return { parentId: parent?.target.id ?? null, releaseIds: [] }
  }

  if (entity.type === 'feature') {
    // Component/product parent uses "parent" relationship type (not "link")
    const compParent = rels.find((r) => r.type === 'parent' && r.target.type === 'component')
    const prodParent = rels.find((r) => r.type === 'parent' && r.target.type === 'product')
    const parentId = compParent?.target.id ?? prodParent?.target.id ?? null

    // Releases use "link" type
    const releaseIds = rels
      .filter((r) => r.type === 'link' && r.target.type === 'release')
      .map((r) => r.target.id)

    return { parentId, releaseIds }
  }

  return { parentId: null, releaseIds: [] }
}

function normalizeEntity(raw: PBApiEntity): EffortEntity {
  const { parentId, releaseIds } = extractParentAndReleases(raw)

  return {
    id: raw.id,
    type: raw.type as EffortEntity['type'],
    name: raw.fields.name,
    effort: typeof raw.fields.effort === 'number' ? raw.fields.effort : null,
    status: raw.fields.status?.name ?? null,
    archived: (raw.fields.archived as boolean | undefined) ?? false,
    parentId,
    releaseIds,
  }
}

async function fetchEffortForFeatures(features: EffortEntity[], token: string): Promise<void> {
  // The paginated /v2/entities endpoint omits the effort field.
  // Fetch each feature individually in batches to get the plain-number effort value.
  const BATCH = 10
  for (let i = 0; i < features.length; i += BATCH) {
    const batch = features.slice(i, i + BATCH)
    await Promise.all(
      batch.map(async (feature) => {
        try {
          const res = await pbFetch<{ data: PBApiEntity }>(
            `${PB_API_BASE}/entities/${feature.id}`,
            token,
          )
          const raw = res.data
          if (typeof raw.fields.effort === 'number') {
            feature.effort = raw.fields.effort
          }
        } catch {
          // leave effort as null if individual fetch fails
        }
      }),
    )
    if (i + BATCH < features.length) await sleep(200)
  }
}

export async function fetchAllEffortEntities(token: string): Promise<{
  products: EffortEntity[]
  components: EffortEntity[]
  features: EffortEntity[]
  releases: EffortEntity[]
}> {
  const products: EffortEntity[] = []
  const components: EffortEntity[] = []
  const features: EffortEntity[] = []
  const releases: EffortEntity[] = []

  let nextUrl: string | null = `${PB_API_BASE}/entities`

  while (nextUrl) {
    const page: PBApiPage<PBApiEntity> = await pbFetch<PBApiPage<PBApiEntity>>(nextUrl, token)

    for (const item of page.data) {
      if (!EFFORT_TYPES.has(item.type)) continue
      const entity = normalizeEntity(item)

      // Skip archived containers — but keep archived features (e.g. "Won't do" status)
      if (entity.archived && entity.type !== 'feature') continue

      if (entity.type === 'product') products.push(entity)
      else if (entity.type === 'component') components.push(entity)
      else if (entity.type === 'feature') features.push(entity)
      else if (entity.type === 'release') releases.push(entity)
    }

    nextUrl = page.links.next ?? null
    if (nextUrl) await sleep(100)
  }

  // Paginated endpoint omits effort — fetch individually
  await fetchEffortForFeatures(features, token)

  return { products, components, features, releases }
}
