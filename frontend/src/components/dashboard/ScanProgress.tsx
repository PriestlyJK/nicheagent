'use client'
import { Check, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import type { Scan } from '@/types'

const SOURCES = [
  { id: 'reddit',        label: 'Reddit',        sub: 'pain point clusters' },
  { id: 'google_trends', label: 'Google Trends', sub: 'velocity & growth' },
  { id: 'producthunt',   label: 'Product Hunt',  sub: 'new entrants' },
  { id: 'meta_ads',      label: 'Meta Ads',      sub: 'creative velocity' },
  { id: 'appstore',      label: 'App Store',     sub: 'review clusters' },
]

interface ScanProgressProps {
  scan: Scan | undefined
}

export default function ScanProgress({ scan }: ScanProgressProps) {
  if (!scan) return null
  const done = scan.sources_done ?? []

  return (
    <div className="card px-5 py-4 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Loader2 size={15} className="animate-spin text-text-secondary" />
          <span className="text-md font-medium">Scanning market sources…</span>
        </div>
        <span className="text-sm text-text-secondary">
          {done.length}/{SOURCES.length} done
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface-muted rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-ink rounded-full transition-all duration-500"
          style={{ width: `${(done.length / SOURCES.length) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-5 gap-2">
        {SOURCES.map(({ id, label, sub }) => {
          const isDone = done.includes(id)
          const isActive = !isDone && done.length === SOURCES.findIndex(s => s.id === id)
          return (
            <div
              key={id}
              className={clsx(
                'rounded-lg px-3 py-2.5 text-center transition-all',
                isDone ? 'bg-surface-muted' : isActive ? 'bg-ink text-white' : 'bg-surface-soft'
              )}
            >
              <div className="flex justify-center mb-1">
                {isDone
                  ? <Check size={13} className="text-accent-teal" />
                  : isActive
                  ? <Loader2 size={13} className="animate-spin" />
                  : <span className="w-2 h-2 rounded-full bg-surface-border mt-0.5" />
                }
              </div>
              <p className={clsx('text-xs font-medium', isDone ? 'text-text-primary' : isActive ? 'text-white' : 'text-text-tertiary')}>{label}</p>
              <p className={clsx('text-2xs mt-0.5', isDone ? 'text-text-tertiary' : isActive ? 'text-white/70' : 'text-surface-border')}>{sub}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
