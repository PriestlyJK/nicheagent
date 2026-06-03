'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import useSWR, { mutate } from 'swr'
import {
  Radio, RefreshCw, Loader2, Bookmark, Check, ArrowRight,
  Cpu, HeartPulse, Building2, Code, Video, LayoutList,
  Flame, Clock, Swords, Globe, Search, Zap, TrendingUp, Sparkles
} from 'lucide-react'
import { translations, Lang } from '@/lib/i18n'
import type { Niche, Scan } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const fetcher = (url: string) => fetch(url).then(r => r.json())

const CAT_COLORS: Record<string, { bg: string; icon: string }> = {
  ai_saas:  { bg: '#EEEDFE', icon: '#534AB7' },
  health:   { bg: '#E1F5EE', icon: '#0F6E56' },
  b2b:      { bg: '#FAECE7', icon: '#993C1D' },
  devtools: { bg: '#E6F1FB', icon: '#185FA5' },
  creator:  { bg: '#FBEAF0', icon: '#993356' },
  other:    { bg: '#F1EFE8', icon: '#5F5E5A' },
}
const CAT_ICONS: Record<string, React.ElementType> = {
  all: LayoutList, ai_saas: Cpu, health: HeartPulse,
  b2b: Building2, devtools: Code, creator: Video,
}
const COMP_STYLE: Record<string, string> = {
  low:    'bg-[#EAF3DE] text-[#173404] border-[#97C459]/40',
  medium: 'bg-[#FAEEDA] text-[#412402] border-[#EF9F27]/40',
  high:   'bg-[#FCEBEB] text-[#501313] border-[#F09595]/40',
}
const SOURCE_META: Record<string, { label: string; favicon: string; url: string }> = {
  reddit:      { label: 'Reddit',       favicon: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=16',        url: 'https://reddit.com/r/startups/rising' },
  trends:      { label: 'Trends',       favicon: 'https://www.google.com/s2/favicons?domain=trends.google.com&sz=16', url: 'https://trends.google.com' },
  producthunt: { label: 'Product Hunt', favicon: 'https://www.google.com/s2/favicons?domain=producthunt.com&sz=16',   url: 'https://producthunt.com' },
  appstore:    { label: 'App Store',    favicon: 'https://www.google.com/s2/favicons?domain=apple.com&sz=16',         url: 'https://apps.apple.com' },
}

const HOT_TOPICS = [
  { label: 'AI agents for SMBs', icon: '🤖', color: '#534AB7', bg: '#EEEDFE' },
  { label: 'Solo founder tools',  icon: '⚡', color: '#D85A30', bg: '#FAECE7' },
  { label: 'No-code automation',  icon: '🔧', color: '#0F6E56', bg: '#E1F5EE' },
  { label: 'Creator monetization',icon: '💰', color: '#993356', bg: '#FBEAF0' },
  { label: 'B2B micro SaaS',      icon: '📊', color: '#185FA5', bg: '#E6F1FB' },
  { label: 'Health & wearables',  icon: '❤️', color: '#D85A30', bg: '#FAECE7' },
]

export default function Home() {
  const router = useRouter()
  const [lang, setLang]         = useState<Lang>('en')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy]     = useState('signal_score')
  const [saved, setSaved]       = useState<Set<string>>(new Set())
  const [scanId, setScanId]     = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [customTopic, setCustomTopic] = useState('')

  const t = translations[lang]

  const qs = new URLSearchParams({
    sort_by: sortBy,
    ...(category !== 'all' ? { category } : {}),
  }).toString()

  const { data: allNiches = [], isLoading } = useSWR<Niche[]>(
    `${API}/api/niches?${qs}`, fetcher, { refreshInterval: 30000 }
  )

  const niches = searchQuery
    ? allNiches.filter(n =>
        n.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.why_summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allNiches

  useSWR<Scan>(
    scanId ? `${API}/api/niches/scan/${scanId}` : null,
    fetcher,
    {
      refreshInterval: (s: Scan | undefined) => {
        if (!s) return 2000
        if (s.status === 'running') return 3000
        if (s.status === 'done') {
          setScanning(false)
          mutate(`${API}/api/niches?${qs}`)
          return 0
        }
        return 0
      },
    }
  )

  const triggerScan = useCallback(async (topic?: string) => {
    setScanning(true)
    setCustomTopic('')
    try {
      const r = await fetch(`${API}/api/niches/scan`, { method: 'POST' })
      const s = await r.json()
      setScanId(s.id)
    } catch { setScanning(false) }
  }, [])

  const toggleSave = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSaved(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const CATEGORIES = [
    { id: 'all',      label: t.allNiches,  Icon: LayoutList },
    { id: 'ai_saas',  label: t.aiSaas,     Icon: Cpu        },
    { id: 'health',   label: t.health,     Icon: HeartPulse },
    { id: 'b2b',      label: t.b2b,        Icon: Building2  },
    { id: 'devtools', label: t.devtools,   Icon: Code       },
    { id: 'creator',  label: t.creator,    Icon: Video      },
  ]

  const SORTS = [
    { id: 'signal_score', label: t.signalScore, Icon: Flame  },
    { id: 'mvp_weeks',    label: t.timeToMvp,   Icon: Clock  },
    { id: 'fit_score',    label: t.competition, Icon: Swords },
  ]

  return (
    <div style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      {/* Topbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-black/10 h-[52px] flex items-center px-5 gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-[27px] h-[27px] bg-[#0f0f0f] rounded-[7px] flex items-center justify-center">
            <Radio size={14} className="text-white" />
          </div>
          <span className="text-[16px] font-black tracking-tight text-[#0f0f0f]">NicheAgent</span>
        </div>
        <nav className="flex gap-0.5 ml-2">
          {[
            { href: '/',        label: t.discover },
            { href: '/saved',   label: t.saved    },
            { href: '/sources', label: t.sources  },
          ].map(({ href, label }) => (
            <Link key={href} href={href}
              className="px-3 py-1.5 text-[13px] font-semibold rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          {scanning && (
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t.scanning}
            </div>
          )}
          <button onClick={() => setLang(l => l === 'en' ? 'ua' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/15 text-[12px] font-bold text-neutral-700 hover:bg-neutral-50 transition-colors">
            <Globe size={13} />{lang === 'en' ? 'UA' : 'EN'}
          </button>
          <div className="w-8 h-8 rounded-full bg-[#EEEDFE] flex items-center justify-center text-[12px] font-black text-[#534AB7]">ZL</div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-52px)]">
        {/* Sidebar */}
        <aside className="w-[210px] shrink-0 bg-white border-r border-black/10 flex flex-col py-4 px-2.5">
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider px-2 mb-2">{t.browse}</p>
          <div className="flex flex-col gap-0.5 mb-5">
            {CATEGORIES.map(({ id, label, Icon }) => {
              const count = id === 'all' ? allNiches.length
                : allNiches.filter(n => {
                    const cat = (n.category || '').toLowerCase().replace(/[\s-]/g, '_')
                    return cat === id || cat.startsWith(id.split('_')[0])
                  }).length
              return (
                <button key={id} onClick={() => setCategory(id)}
                  className={clsx('flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-bold w-full text-left transition-all',
                    category === id ? 'bg-[#0f0f0f] text-white' : 'text-neutral-700 hover:bg-neutral-100'
                  )}>
                  <Icon size={14} className="shrink-0" />
                  <span className="flex-1 text-[12px]">{label}</span>
                  <span className={clsx('text-[10px] font-black px-1.5 py-0.5 rounded-md min-w-[20px] text-center',
                    category === id ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                  )}>{count}</span>
                </button>
              )
            })}
          </div>

          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider px-2 mb-2">{t.sortBy}</p>
          <div className="flex flex-col gap-0.5 mb-5">
            {SORTS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setSortBy(id)}
                className={clsx('flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-bold w-full text-left transition-all',
                  sortBy === id ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-600 hover:bg-neutral-50'
                )}>
                <Icon size={14} className="shrink-0" />
                <span className="flex-1">{label}</span>
                {sortBy === id && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#D85A30] text-white">TOP</span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-auto pt-3 border-t border-black/8">
            <button onClick={() => triggerScan()} disabled={scanning}
              className={clsx('w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-black transition-all',
                scanning ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-[#0f0f0f] text-white hover:bg-neutral-800 active:scale-[.98]'
              )}>
              {scanning ? <><Loader2 size={13} className="animate-spin" />{t.scanning}</> : <><RefreshCw size={13} />{t.newScan}</>}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto bg-[#F2F0EB]">

          {/* ── Search widget ── */}
          <div className="px-5 pt-5 pb-4">
            <div className="bg-white rounded-2xl border border-black/10 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={18} className="text-[#534AB7]" />
                <div>
                  <p className="text-[15px] font-black text-[#0f0f0f]">Discover startup opportunities</p>
                  <p className="text-[12px] font-semibold text-neutral-500">Search existing or trigger a new AI-powered market scan</p>
                </div>
              </div>

              {/* Search bar */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 flex items-center gap-2.5 bg-neutral-50 border border-black/10 rounded-xl px-3 py-2.5 hover:border-black/20 transition-colors">
                  <Search size={15} className="text-neutral-400 shrink-0" />
                  <input
                    type="text"
                    placeholder={lang === 'en' ? 'Search niches, topics, keywords…' : 'Пошук ніш, тем, ключових слів…'}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-[13px] font-semibold text-neutral-900 placeholder:text-neutral-400 outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-neutral-400 hover:text-neutral-700 text-[11px] font-bold">✕</button>
                  )}
                </div>
                <button onClick={() => triggerScan()} disabled={scanning}
                  className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-black transition-all shrink-0',
                    scanning ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' : 'bg-[#534AB7] text-white hover:bg-[#3C3489] active:scale-[.98]'
                  )}>
                  {scanning ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  {scanning ? (lang === 'en' ? 'Scanning…' : 'Сканування…') : (lang === 'en' ? 'New scan' : 'Новий скан')}
                </button>
              </div>

              {/* Hot topics */}
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-2">
                  {lang === 'en' ? '🔥 Hot right now' : '🔥 Гаряче зараз'}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {HOT_TOPICS.map(topic => (
                    <button key={topic.label}
                      onClick={() => setSearchQuery(topic.label)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all hover:scale-[1.02] active:scale-[.98]"
                      style={{ background: topic.bg, color: topic.color, borderColor: topic.color + '30' }}>
                      {topic.label}
                      <TrendingUp size={10} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feed header */}
          <div className="flex items-center justify-between px-5 mb-3">
            <h2 className="text-[15px] font-black text-[#0f0f0f]">
              {searchQuery
                ? (lang === 'en' ? `Results for "${searchQuery}"` : `Результати: "${searchQuery}"`)
                : t.topOpportunities}
            </h2>
            <span className="text-[12px] font-semibold text-neutral-500">
              {t.foundSorted(niches.length)} · {t.updatedLive}
            </span>
          </div>

          <div className="px-5 pb-5">
            {/* Loading */}
            {isLoading && (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-black/10 p-5 animate-pulse">
                    <div className="flex gap-3 mb-3">
                      <div className="w-11 h-11 bg-neutral-100 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-neutral-100 rounded-lg w-3/4" />
                        <div className="h-3 bg-neutral-100 rounded-lg w-1/3" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-neutral-100 rounded-lg" />
                      <div className="h-3 bg-neutral-100 rounded-lg w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!isLoading && niches.length === 0 && (
              <div className="bg-white rounded-xl border border-black/10 px-8 py-12 text-center">
                <p className="text-[18px] font-black text-[#0f0f0f] mb-2">{t.noNichesYet}</p>
                <p className="text-[14px] font-semibold text-neutral-500 mb-6 max-w-md mx-auto leading-relaxed">{t.noNichesDesc}</p>
                <button onClick={() => triggerScan()}
                  className="bg-[#534AB7] text-white px-6 py-2.5 rounded-xl text-[14px] font-black hover:bg-[#3C3489] transition-colors">
                  {t.startFirstScan}
                </button>
              </div>
            )}

            {/* Grid */}
            {!isLoading && niches.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {niches.map(niche => {
                  const isSaved    = saved.has(niche.id)
                  const catColor   = CAT_COLORS[niche.category] ?? CAT_COLORS.other
                  const Icon       = CAT_ICONS[niche.category] ?? LayoutList
                  const compStyle  = COMP_STYLE[niche.competition ?? 'medium'] ?? COMP_STYLE.medium
                  const signalColor = niche.signal_score >= 80 ? '#D85A30' : niche.signal_score >= 65 ? '#0f0f0f' : '#5F5E5A'

                  return (
                    <div key={niche.id}
                      onClick={() => router.push(`/niche/${niche.id}`)}
                      className="bg-white rounded-xl border border-black/10 p-5 flex flex-col gap-3 cursor-pointer hover:border-black/25 hover:shadow-md transition-all group">

                      {/* Head */}
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                             style={{ background: catColor.bg }}>
                          <Icon size={20} style={{ color: catColor.icon }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] font-black text-[#0f0f0f] leading-snug mb-1 line-clamp-2">{niche.name}</h3>
                          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">
                            {niche.category?.replace(/_/g, ' ') ?? 'other'}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-1">
                          <div className="text-[28px] font-black leading-none tracking-tight" style={{ color: signalColor }}>{niche.signal_score}</div>
                          <div className="text-[10px] font-black text-neutral-500 mt-0.5 uppercase tracking-wider">{t.signal}</div>
                        </div>
                      </div>

                      {/* Desc */}
                      <p className="text-[13px] font-semibold text-neutral-700 leading-relaxed line-clamp-3">{niche.why_summary}</p>

                      {/* Tags */}
                      <div className="flex gap-1.5 flex-wrap">
                        {niche.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-black/6">
                            {tag}
                          </span>
                        ))}
                        <span className={clsx('text-[11px] font-black px-2.5 py-1 rounded-full border', compStyle)}>
                          {niche.competition === 'low' ? t.competition_low : niche.competition === 'medium' ? t.competition_med : t.competition_high}
                        </span>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-black/8 gap-2">
                        <div className="flex gap-1.5 items-center flex-wrap">
                          {['reddit', 'trends'].map(src => {
                            const meta = SOURCE_META[src]
                            return (
                              <a key={src} href={meta.url} target="_blank" rel="noopener noreferrer"
                                 onClick={e => e.stopPropagation()}
                                 className="group/src flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-100 border border-black/6 text-[11px] font-bold text-neutral-700 hover:bg-white hover:border-black/20 hover:text-neutral-900 transition-all">
                                <img src={meta.favicon} alt={meta.label} className="w-3.5 h-3.5 rounded-sm"
                                     onError={e => ((e.currentTarget as HTMLImageElement).style.display='none')} />
                                {meta.label}
                                <ArrowRight size={9} className="opacity-0 group-hover/src:opacity-100 transition-opacity" />
                              </a>
                            )
                          })}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <span className="text-[11px] font-black text-neutral-600 bg-neutral-100 px-2.5 py-1.5 rounded-lg border border-black/8">
                            {t.mvpLabel} {niche.mvp_weeks}w
                          </span>
                          <button onClick={e => toggleSave(niche.id, e)} aria-label={t.saveNiche}
                            className={clsx('w-8 h-8 rounded-lg flex items-center justify-center border transition-all',
                              isSaved ? 'bg-[#EEEDFE] border-[#AFA9EC] text-[#534AB7]' : 'border-black/12 text-neutral-500 hover:border-black/25 hover:text-neutral-800'
                            )}>
                            {isSaved ? <Check size={14} /> : <Bookmark size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
