'use client'
import { Bookmark, Check, ArrowRight } from 'lucide-react'
import clsx from 'clsx'
import type { Niche } from '@/types'

const TAG_STYLE: Record<string, string> = {
  'pain cluster':      'chip-signal',
  'multiple entrants': 'chip-entry',
  'creative velocity': 'chip-signal',
  'funding cluster':   'chip-trend',
  'review cluster':    'chip-signal',
  'low competition':   'chip-trend',
  'regulatory shift':  'chip-signal',
  'paywall shift':     'chip-signal',
  'trend':             'chip-trend',
}

const COMP_COLOR: Record<string, string> = {
  low:    'text-accent-teal bg-accent-teal-light',
  medium: 'text-accent-amber bg-accent-amber-light',
  high:   'text-red-600 bg-red-50',
}

interface NicheRowProps {
  niche: Niche
  rank: number
  saved: boolean
  onSave: () => void
  onOpen: () => void
}

export default function NicheRow({ niche, rank, saved, onSave, onOpen }: NicheRowProps) {
  const bars = [niche.signal_score, niche.fit_score,
    Math.max(10, 100 - niche.mvp_weeks * 10),
    niche.competition === 'low' ? 80 : niche.competition === 'medium' ? 50 : 25]

  return (
    <div
      onClick={onOpen}
      className={clsx(
        'card-hover group flex items-start gap-4 px-4 py-3.5',
        rank === 1 && 'border-l-2 border-l-ink rounded-l-none'
      )}
    >
      {/* Rank */}
      <span className="text-sm text-text-tertiary font-medium pt-0.5 w-5 shrink-0 tabular-nums">
        {String(rank).padStart(2, '0')}
      </span>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <h3 className="text-md font-medium text-text-primary leading-snug mb-1.5 truncate">
          {niche.name}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed mb-2.5 line-clamp-2">
          {niche.why_summary}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {niche.tags.map(tag => (
            <span key={tag} className={clsx('chip', TAG_STYLE[tag] ?? '')}>
              {tag}
            </span>
          ))}
          <span className={clsx(
            'chip font-medium',
            COMP_COLOR[niche.competition] ?? ''
          )}>
            {niche.competition} competition
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-2.5 shrink-0">
        {/* Score */}
        <div className="text-right">
          <p className="text-2xl font-medium tracking-tight">{niche.signal_score}</p>
          <p className="text-2xs text-text-tertiary mt-0.5">signal</p>
        </div>

        {/* Mini bar chart */}
        <div className="flex gap-1 items-end h-5">
          {bars.map((v, i) => (
            <div
              key={i}
              className="w-1.5 rounded-sm transition-all"
              style={{
                height: `${Math.round(v / 5)}px`,
                background: v > 75 ? '#0f0f0f' : v > 50 ? '#6b6b6b' : '#d4d4d4',
              }}
            />
          ))}
        </div>

        {/* MVP */}
        <span className="text-xs text-text-secondary bg-surface-muted px-2 py-0.5 rounded-md">
          MVP {niche.mvp_weeks}w
        </span>

        {/* Actions */}
        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={onSave}
            className={clsx(
              'w-7 h-7 rounded-lg flex items-center justify-center border transition-all',
              saved
                ? 'bg-accent-purple-light border-accent-purple/30 text-accent-purple'
                : 'border-surface-border bg-white text-text-tertiary hover:border-black/20 hover:text-text-primary'
            )}
            aria-label={saved ? 'Unsave' : 'Save'}
          >
            {saved ? <Check size={13} /> : <Bookmark size={13} />}
          </button>
          <button
            onClick={onOpen}
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-surface-border bg-white text-text-tertiary hover:border-black/20 hover:text-text-primary transition-all"
            aria-label="Open detail"
          >
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
