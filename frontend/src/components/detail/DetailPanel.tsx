'use client'
import { useState } from 'react'
import { X, ExternalLink, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import type { Niche, Signal, Competitor } from '@/types'
import RoadmapBuilder from '@/components/roadmap/RoadmapBuilder'

const TABS = ['Sources', 'Competitors', 'Roadmap', 'Founders', 'Adjacent']

const SOURCE_STYLE: Record<string, { bg: string; text: string }> = {
  reddit:      { bg: 'bg-accent-coral-light',  text: 'text-accent-coral-dark' },
  trends:      { bg: 'bg-accent-green-light',   text: 'text-accent-green-dark' },
  producthunt: { bg: 'bg-accent-purple-light',  text: 'text-accent-purple-dark' },
  meta_ads:    { bg: 'bg-accent-purple-light',  text: 'text-accent-purple-dark' },
  appstore:    { bg: 'bg-accent-amber-light',   text: 'text-accent-amber-dark' },
}

interface DetailPanelProps {
  niche: Niche & { signals?: Signal[]; competitors?: Competitor[] }
  onClose: () => void
}

export default function DetailPanel({ niche, onClose }: DetailPanelProps) {
  const [tab, setTab] = useState(0)
  const [openSignal, setOpenSignal] = useState<string | null>(null)
  const [openComp, setOpenComp]     = useState<string | null>(null)

  const signals    = niche.signals     ?? []
  const competitors = niche.competitors ?? []

  const scoreBoxes = [
    { label: 'Signal',      value: niche.signal_score, why: 'High post volume + specific friction language confirmed' },
    { label: 'Fit',         value: niche.fit_score,    why: 'Buildable solo with existing APIs, no infra complexity' },
    { label: 'MVP',         value: `${niche.mvp_weeks}w`, why: 'Based on your solo + bootstrap profile' },
    { label: 'Competition', value: niche.competition,  why: 'No dominant player — micro competitors only' },
  ]

  return (
    <aside className="w-[360px] shrink-0 bg-white border-l border-surface-border flex flex-col slide-in overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-0 border-b border-surface-border">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-md font-medium leading-snug text-text-primary">{niche.name}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 shrink-0 -mt-0.5">
            <X size={15} />
          </button>
        </div>

        {/* Score boxes */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {scoreBoxes.map(({ label, value, why }) => (
            <div key={label} className="bg-surface-soft rounded-lg px-2.5 py-2 group relative">
              <p className="text-2xs text-text-tertiary mb-1">{label}</p>
              <p className="text-base font-medium capitalize">{value}</p>
              {/* Tooltip */}
              <div className="absolute bottom-full left-0 mb-1.5 w-48 bg-ink text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 leading-relaxed">
                {why}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 -mx-5 px-5">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={clsx(
                'px-3 py-2 text-xs transition-colors border-b-2 whitespace-nowrap',
                tab === i
                  ? 'border-ink text-text-primary font-medium'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* SOURCES */}
        {tab === 0 && (
          <div className="space-y-2">
            {signals.length === 0 && (
              <p className="text-sm text-text-secondary py-6 text-center">
                No signals yet — trigger a scan to load live data.
              </p>
            )}
            {signals.map(sig => {
              const style = SOURCE_STYLE[sig.source] ?? SOURCE_STYLE.reddit
              const isOpen = openSignal === sig.id
              return (
                <div
                  key={sig.id}
                  onClick={() => setOpenSignal(isOpen ? null : sig.id)}
                  className={clsx(
                    'rounded-xl p-3.5 cursor-pointer transition-all',
                    isOpen ? 'bg-white border border-black/10' : 'bg-surface-soft hover:bg-surface-muted'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={clsx('text-2xs font-medium px-2 py-0.5 rounded-md shrink-0 mt-0.5', style.bg, style.text)}>
                      {sig.source.replace('_', ' ')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary leading-snug line-clamp-2">{sig.title}</p>
                      {sig.metadata?.score && (
                        <p className="text-xs text-text-tertiary mt-1">
                          ↑ {sig.metadata.score as number} · {sig.metadata.subreddit as string}
                        </p>
                      )}
                    </div>
                  </div>
                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-surface-border">
                      <p className="text-xs text-text-secondary leading-relaxed mb-2">{sig.content}</p>
                      {sig.source_url && (
                        <a
                          href={sig.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-accent-purple hover:underline"
                        >
                          Open original <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* COMPETITORS */}
        {tab === 1 && (
          <div className="space-y-2">
            {competitors.length === 0 && (
              <p className="text-sm text-text-secondary py-6 text-center">Run a scan to load competitor data.</p>
            )}
            {competitors.map(comp => {
              const isOpen = openComp === comp.id
              return (
                <div
                  key={comp.id}
                  className={clsx('rounded-xl border transition-all', isOpen ? 'border-ink' : 'border-surface-border')}
                >
                  <button
                    onClick={() => setOpenComp(isOpen ? null : comp.id)}
                    className="w-full flex items-center gap-3 px-3.5 py-3 text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center text-xs font-medium shrink-0">
                      {comp.name.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{comp.name}</p>
                      <div className="flex gap-1.5 mt-0.5">
                        {comp.arr_estimate && <span className="text-2xs bg-accent-green-light text-accent-green-dark px-1.5 py-0.5 rounded">{comp.arr_estimate}</span>}
                        {comp.funding && <span className="text-2xs bg-surface-muted text-text-secondary px-1.5 py-0.5 rounded">{comp.funding}</span>}
                      </div>
                    </div>
                    <ChevronRight size={14} className={clsx('text-text-tertiary transition-transform shrink-0', isOpen && 'rotate-90')} />
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 border-t border-surface-border pt-3">
                      <p className="text-2xs font-medium text-accent-coral-dark mb-2 uppercase tracking-wider">Gaps to exploit</p>
                      <div className="space-y-1.5">
                        {comp.gaps.map((g, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-coral mt-1.5 shrink-0" />
                            <p className="text-xs text-text-secondary leading-relaxed">{g}</p>
                          </div>
                        ))}
                      </div>
                      {comp.ph_url && (
                        <a href={comp.ph_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-accent-purple mt-3 hover:underline">
                          Product Hunt <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ROADMAP */}
        {tab === 2 && <RoadmapBuilder nicheId={niche.id} nicheName={niche.name} />}

        {/* FOUNDERS */}
        {tab === 3 && (
          <div className="py-6 text-center">
            <p className="text-sm text-text-secondary mb-3">Founder profiles with LinkedIn links and weakness analysis load after scan completes.</p>
            <button className="btn text-sm">Load founder profiles</button>
          </div>
        )}

        {/* ADJACENT */}
        {tab === 4 && (
          <div className="py-6 text-center">
            <p className="text-sm text-text-secondary mb-3">Adjacent niches where demand exists but no dominant product yet.</p>
            <button className="btn text-sm">Load adjacent niches</button>
          </div>
        )}
      </div>
    </aside>
  )
}
