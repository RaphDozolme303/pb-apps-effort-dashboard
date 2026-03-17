import { NextResponse } from 'next/server'
import { getCacheStatus } from '@/lib/cache'

export function GET() {
  return NextResponse.json(getCacheStatus())
}
