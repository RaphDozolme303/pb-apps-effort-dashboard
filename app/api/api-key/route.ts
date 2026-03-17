import { NextResponse } from 'next/server'
import { isApiKeyConfigured, saveApiToken, deleteApiToken } from '@/lib/config'

export function GET() {
  return NextResponse.json({ configured: isApiKeyConfigured() })
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const token = (body as Record<string, unknown>)?.token
  if (typeof token !== 'string' || !token.trim()) {
    return NextResponse.json({ ok: false, error: 'token is required' }, { status: 400 })
  }

  try {
    saveApiToken(token.trim())
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export function DELETE() {
  deleteApiToken()
  return NextResponse.json({ ok: true })
}
