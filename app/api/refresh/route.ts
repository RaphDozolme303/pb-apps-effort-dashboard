import { NextResponse } from 'next/server'
import { refreshCache } from '@/lib/cache'

export async function POST() {
  try {
    const cache = await refreshCache()
    return NextResponse.json({
      ok: true,
      counts: {
        products: cache.products.length,
        components: cache.components.length,
        features: cache.features.length,
        releases: cache.releases.length,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
