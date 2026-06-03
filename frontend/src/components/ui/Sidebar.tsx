'use client'
import clsx from 'clsx'
import { Cpu, HeartPulse, Building2, Video, LayoutList,
         Flame, Clock, Swords, RefreshCw, Loader2 } from 'lucide-react'

const CATEGORIES = [
  { id: 'all',      label: 'All niches',  icon: LayoutList,  count: 47 },
  { id: 'ai_saas',  label: 'AI & SaaS',   icon: Cpu,         count: 18 },
  { id: 'health',   label: 'Health tech', icon: HeartPulse,  count: 9  },
  { id: 'b2b',      label: 'B2B tools',   icon: Building2,   count: 12 },
  { id: 'creator',  label: 'Creator',     icon: Video,       count: 8  },
]

const SORTS = [
  { id: 'signal_score', label: 'Signal score', icon: Flame },
  { id: 'mvp_weeks',    label: 'Time to MVP',  icon: Clock },
  { id: 'fit_score',    label: 'Best fit',     icon: Swords },
]

interface SidebarProps {
  category: string
  sort: string
  onCategory: (c: string) => void
  onSort: (s: string) => void
  onScan: () => void
  scanning: boolean
}

export default function Sidebar({
  category, sort, onCategory, onSort, onScan, scanning
}: SidebarProps) {
  return (
    <aside className="w-[200px] shrink-0 flex flex-col bg-white border-r border-surface-border h-full">
      <div className="flex-1 overflow-y-auto py-4 px-2.5">

        {/* Categories */}
        <p className="label px-2 mb-2">Browse</p>
        <div className="flex flex-col gap-0.5 mb-5">
          {CATEGORIES.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => onCategory(id)}
              className={clsx(
                'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm w-full text-left transition-colors',
                category === id
                  ? 'bg-surface-muted text-text-primary font-medium'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              )}
            >
              <Icon size={15} className="shrink-0" />
              <span className="flex-1">{label}</span>
              <span className={clsx(
                'text-2xs px-1.5 py-0.5 rounded-md',
                category === id
                  ? 'bg-ink text-white'
                  : 'bg-surface-muted text-text-tertiary'
              )}>{count}</span>
            </button>
          ))}
        </div>

        {/* Sort */}
        <p className="label px-2 mb-2">Sort by</p>
        <div className="flex flex-col gap-0.5">
          {SORTS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onSort(id)}
              className={clsx(
                'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm w-full text-left transition-colors',
                sort === id
                  ? 'bg-surface-muted text-text-primary font-medium'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              )}
            >
              <Icon size={15} className="shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Scan button */}
      <div className="p-3 border-t border-surface-border">
        <button
          onClick={onScan}
          disabled={scanning}
          className={clsx(
            'w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all',
            scanning
              ? 'bg-surface-muted text-text-secondary cursor-not-allowed'
              : 'bg-ink text-white hover:bg-ink-soft'
          )}
        >
          {scanning
            ? <><Loader2 size={14} className="animate-spin" /> Scanning…</>
            : <><RefreshCw size={14} /> New scan</>
          }
        </button>
      </div>
    </aside>
  )
}
