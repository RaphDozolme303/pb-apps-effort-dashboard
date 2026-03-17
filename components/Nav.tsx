'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function Nav() {
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleDisconnect() {
    setDisconnecting(true)
    await fetch('/api/api-key', { method: 'DELETE' })
    window.location.reload()
  }

  return (
    <header style={{ backgroundColor: 'var(--pb-blue)' }}>
      <div className="max-w-5xl mx-auto px-6 flex items-center gap-6 h-16">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image src="/pb-logo.png" alt="PB" width={32} height={32} className="object-contain" />
          <span className="font-semibold text-white text-sm tracking-wide">Effort Dashboard</span>
        </Link>

        <div className="ml-auto">
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-blue-200 hover:text-white text-xs transition-colors disabled:opacity-50"
          >
            {disconnecting ? 'Disconnecting…' : 'Disconnect workspace'}
          </button>
        </div>
      </div>
    </header>
  )
}
