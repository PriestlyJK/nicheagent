'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { useRoadmap } from '@/hooks'
import { Loader2, RotateCw } from 'lucide-react'

const BUDGETS = ['bootstrap', 'small', 'funded'] as const
const TEAMS   = ['solo', 'two', 'small'] as const
const TIMELINES = [{ v: 2, l: '2 wks' }, { v: 3, l: '3 wks' }, { v: 6, l: '6 wks' }]

type Budget   = typeof BUDGETS[number]
type Team     = typeof TEAMS[number]

interface RoadmapBuilderProps {
  nicheId: string
  nicheName: string
}

export default function RoadmapBuilder({ nicheId, nicheName }: RoadmapBuilderProps) {
  const [budget,   setBudget]   = useState<Budget>('bootstrap')
  const [team,     setTeam]     = useState<Team>('solo')
  const [timeline, setTimeline] = useState(3)
  const [flipped,  setFlipped]  = useState<Record<number, boolean>>({})

  const { roadmap, isLoading } = useRoadmap(nicheId, {
    budget, team, timeline_weeks: timeline
  })

  const PHASE_COLORS = [
    { bg: '#0f0f0f', text: '#ffffff', light: '#f1f0ee' },
    { bg: '#534AB7', text: '#ffffff', light: '#EEEDFE' },
    { bg: '#1D9E75', text: '#ffffff', light: '#E1F5EE' },
    { bg: '#D85A30', text: '#ffffff', light: '#FAECE7' },
    { bg: '#BA7517', text: '#ffffff', light: '#FAEEDA' },
  ]

  return (
    <div>
      {/* Params */}
      <div className="bg-surface-soft rounded-xl p-3 mb-4 space-y-3">
        {/* Budget */}
        <div>
          <p className="label mb-1.5">Budget</p>
          <div className="flex gap-1.5">
            {BUDGETS.map(b => (
              <button key={b} onClick={() => setBudget(b)}
                className={clsx('flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize',
                  budget === b ? 'bg-ink text-white border-ink' : 'border-surface-border bg-white text-text-secondary hover:border-black/20'
                )}>{b}</button>
            ))}
          </div>
        </div>

        {/* Team */}
        <div>
          <p className="label mb-1.5">Team</p>
          <div className="flex gap-1.5">
            {TEAMS.map(t => (
              <button key={t} onClick={() => setTeam(t)}
                className={clsx('flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize',
                  team === t ? 'bg-ink text-white border-ink' : 'border-surface-border bg-white text-text-secondary hover:border-black/20'
                )}>{t}</button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <p className="label mb-1.5">Timeline</p>
          <div className="flex gap-1.5">
            {TIMELINES.map(({ v, l }) => (
              <button key={v} onClick={() => setTimeline(v)}
                className={clsx('flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  timeline === v ? 'bg-ink text-white border-ink' : 'border-surface-border bg-white text-text-secondary hover:border-black/20'
                )}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Cost summary */}
      {roadmap && (
        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-surface-soft rounded-lg px-3 py-2.5">
            <p className="text-2xs text-text-tertiary mb-0.5">Monthly cost</p>
            <p className="text-base font-medium">{roadmap.total_monthly_cost}</p>
          </div>
          <div className="flex-1 bg-surface-soft rounded-lg px-3 py-2.5">
            <p className="text-2xs text-text-tertiary mb-0.5">Break-even</p>
            <p className="text-base font-medium">{roadmap.break_even_customers} customers</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-10 gap-2 text-text-secondary">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Generating roadmap…</span>
        </div>
      )}

      {/* Flip cards */}
      {roadmap && (
        <div className="space-y-2">
          {roadmap.phases.map((phase, i) => {
            const color = PHASE_COLORS[i % PHASE_COLORS.length]
            const isFlipped = flipped[i]
            return (
              <div
                key={i}
                className="perspective cursor-pointer h-[180px] relative"
                onClick={() => setFlipped(f => ({ ...f, [i]: !f[i] }))}
              >
                <div className={clsx('flip-inner absolute inset-0', isFlipped && 'flipped')}>
                  {/* Front */}
                  <div
                    className="flip-front absolute inset-0 rounded-xl p-4 flex flex-col"
                    style={{ background: color.bg, color: color.text }}
                  >
                    <p className="text-2xs font-medium mb-2 opacity-60 uppercase tracking-wider">{phase.week_label}</p>
                    <p className="text-md font-medium mb-2 leading-snug">{phase.title}</p>
                    <p className="text-xs opacity-75 leading-relaxed flex-1 line-clamp-3">{phase.why}</p>
                    <div className="flex items-center gap-1 mt-2 opacity-50">
                      <RotateCw size={11} />
                      <span className="text-2xs">tap for tasks & tools</span>
                    </div>
                  </div>

                  {/* Back */}
                  <div
                    className="flip-back absolute inset-0 rounded-xl p-4 overflow-y-auto"
                    style={{ background: color.light }}
                  >
                    <p className="text-2xs font-medium text-text-tertiary mb-2 uppercase tracking-wider">{phase.week_label} · Tasks</p>
                    <div className="space-y-1 mb-3">
                      {phase.tasks.slice(0, 3).map((t, ti) => (
                        <div key={ti} className="flex gap-2 items-start">
                          <span className="text-accent-teal mt-0.5 shrink-0 text-xs">✓</span>
                          <p className="text-xs text-text-secondary leading-relaxed">{t}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-2xs font-medium text-text-tertiary mb-1.5 uppercase tracking-wider">Tools</p>
                    <div className="space-y-1">
                      {phase.tools.slice(0, 2).map((tool, ti) => (
                        <div key={ti} className="flex items-center justify-between">
                          <a
                            href={tool.url} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-accent-purple hover:underline"
                          >
                            {tool.name}
                          </a>
                          <span className="text-xs text-text-secondary">{tool.cost}</span>
                        </div>
                      ))}
                    </div>
                    {phase.risks[0] && (
                      <p className="text-2xs text-accent-amber-dark bg-accent-amber-light rounded px-2 py-1 mt-2">
                        ⚠ {phase.risks[0]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
