import { NextResponse } from 'next/server'
import { loadCache } from '@/lib/cache'
import { getApiToken, PB_API_BASE } from '@/lib/config'

export async function GET() {
  const cache = loadCache()
  if (!cache) return NextResponse.json({ error: 'No cache' }, { status: 404 })

  // Find a feature that the user knows should have effort (e.g. "Brake Wear")
  const target = cache.features.find((f) => f.name.toLowerCase().includes('brake'))
    ?? cache.features[0]

  let rawFields: unknown = null
  try {
    const token = getApiToken()
    const res = await fetch(`${PB_API_BASE}/entities/${target?.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const data = await res.json() as { data: { fields: Record<string, unknown> } }
    rawFields = data.data.fields  // show ALL fields
  } catch (err) {
    rawFields = { error: String(err) }
  }

  return NextResponse.json({
    targetFeature: target?.name,
    rawFields,
    effortWithParent: cache.features.filter((f) => f.parentId !== null && f.effort !== null).length,
    effortNull: cache.features.filter((f) => f.effort === null).length,
  })
}
