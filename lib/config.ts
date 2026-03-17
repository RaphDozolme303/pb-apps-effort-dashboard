import fs from 'fs'
import path from 'path'

export const PB_API_BASE = 'https://api.productboard.com/v2'

const API_KEY_PATH = path.join(process.cwd(), 'data', 'api-key.json')

function readStoredToken(): string | null {
  try {
    const raw = fs.readFileSync(API_KEY_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as { token?: string }
    return parsed.token ?? null
  } catch {
    return null
  }
}

export function isApiKeyConfigured(): boolean {
  return !!(process.env.PRODUCTBOARD_API_TOKEN || readStoredToken())
}

export function getApiToken(): string {
  const token = process.env.PRODUCTBOARD_API_TOKEN ?? readStoredToken()
  if (!token) throw new Error('No Productboard API token configured')
  return token
}

export function saveApiToken(token: string): void {
  const dir = path.dirname(API_KEY_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(API_KEY_PATH, JSON.stringify({ token }, null, 2), 'utf-8')
}

export function deleteApiToken(): void {
  try {
    fs.unlinkSync(API_KEY_PATH)
  } catch {
    // file didn't exist — fine
  }
}

export function getCacheTtlHours(): number {
  return parseInt(process.env.CACHE_TTL_HOURS ?? '24', 10)
}
