'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import clsx from 'clsx'
import {
  Radio, Globe, Bookmark, BookmarkCheck, ChevronRight,
  Search, Zap, TrendingUp, ExternalLink, Loader2, RefreshCw,
  Flame, Clock, DollarSign, X,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const fetcher = (url: string) => fetch(url).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })

const compColor: Record<string,string> = { low: '#27500A', medium: '#633806', high: '#A32D2D' }
const compBg:    Record<string,string> = { low: '#EAF3DE', medium: '#FAEEDA', high: '#FCEBEB' }

// ── Source config ──────────────────────────────────────────────────────────
const SOURCES = [
  { id: 'reddit',     label: 'Reddit',     domain: 'reddit.com',            linkLabel: 'View thread', color: '#FF4500', borderColor: '#FF450030' },
  { id: 'appstore',   label: 'App Store',  domain: 'apple.com',             linkLabel: 'View review', color: '#007AFF', borderColor: '#007AFF30' },
  { id: 'hackernews', label: 'HackerNews', domain: 'news.ycombinator.com',  linkLabel: 'View post',   color: '#FF6600', borderColor: '#FF660030' },
]

// ── Favicon img ────────────────────────────────────────────────────────────
function Favicon({ domain, size = 16 }: { domain: string; size?: number }) {
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      width={size} height={size}
      className="rounded-[3px] flex-shrink-0"
      onError={e => { (e.target as HTMLImageElement).style.opacity = '0' }}
      alt=""
    />
  )
}

// ── Signal card (matches template design) ─────────────────────────────────
function SignalCard({ signal, source }: { signal: any; source: typeof SOURCES[0] }) {
  const meta = signal.metadata || {}
  const content = (signal.content || '').replace(/^App:.*?\n/m, '').replace(/^Category:.*?\n/m, '').replace(/^Developer:.*?\n/m, '').replace(/^Review.*?:\s*/m, '')
  const lines = content.split('\n').filter((l: string) => l.trim().length > 30)
  const quote = (lines[0] || content).slice(0, 220).trim()
  const subreddit = meta.subreddit || ''
  const appName = meta.app_name || ''
  const score = meta.score || meta.rating_count || 0
  const srcDomain = (() => { try { return new URL(signal.source_url).hostname.replace('www.','') } catch { return source.domain } })()

  // Idea — use signal title, clean it up
  const idea = (signal.title || '').replace(/^1-star review of [^:]+:\s*/i, '').replace(/^App:\s*/i, '')

  return (
    <div className="flex-shrink-0 w-[300px] bg-white border border-black/10 rounded-xl p-4 flex flex-col gap-3 hover:border-black/20 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Favicon domain={srcDomain} size={15} />
          <span className="text-[13px] font-black" style={{ color: source.color }}>
            {subreddit ? `r/${subreddit}` : appName ? appName.split('|')[0].trim() : source.label}
          </span>
        </div>
        {score > 0 && (
          <span className="text-[11px] font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-md">
            {score >= 1000 ? `${Math.round(score/1000)}k` : score}
          </span>
        )}
      </div>

      {/* Quote */}
      <div className="border-l-[2.5px] pl-3" style={{ borderColor: source.color + '50' }}>
        <p className="text-[13px] font-semibold text-[#0f0f0f] leading-relaxed line-clamp-4">
          "{quote}"
        </p>
      </div>

      {/* Link */}
      {signal.source_url && (
        <a href={signal.source_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 hover:text-neutral-700 transition-colors w-fit"
          onClick={e => e.stopPropagation()}>
          <ExternalLink size={10} />
          {source.linkLabel}
        </a>
      )}

      {/* Idea pill */}
      {idea && (
        <div className="bg-[#EEEDFE] rounded-lg px-3 py-2">
          <p className="text-[12px] font-bold text-[#3C3489] line-clamp-2">{idea}</p>
        </div>
      )}
    </div>
  )
}

// ── Source slider ──────────────────────────────────────────────────────────
function SourceSlider({ source }: { source: typeof SOURCES[0] }) {
  const { data: signals = [], isLoading } = useSWR<any[]>(
    `${API}/api/niches/signals?source=${source.id}&limit=15`,
    fetcher,
    { revalidateOnFocus: false }
  )
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (d: 'l'|'r') => ref.current?.scrollBy({ left: d==='r' ? 320 : -320, behavior: 'smooth' })

  if (isLoading) return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Favicon domain={source.domain} size={16} />
        <span className="text-[14px] font-black text-[#0f0f0f]">{source.label}</span>
        <div className="w-20 h-5 bg-neutral-200 rounded-md animate-pulse" />
      </div>
      <div className="flex gap-3">
        {[0,1,2].map(i => <div key={i} className="flex-shrink-0 w-[300px] h-[200px] bg-neutral-100 rounded-xl animate-pulse" />)}
      </div>
    </div>
  )

  if (!signals.length) return null

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Favicon domain={source.domain} size={16} />
          <span className="text-[14px] font-black text-[#0f0f0f]">{source.label}</span>
          <span className="text-[11px] font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-md">
            {signals.length} signals
          </span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => scroll('l')} className="w-7 h-7 rounded-lg border border-black/10 bg-white flex items-center justify-center text-neutral-500 hover:bg-neutral-50 transition-colors">
            <ChevronRight size={13} className="rotate-180" />
          </button>
          <button onClick={() => scroll('r')} className="w-7 h-7 rounded-lg border border-black/10 bg-white flex items-center justify-center text-neutral-500 hover:bg-neutral-50 transition-colors">
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {signals.map((sig: any) => <SignalCard key={sig.id} signal={sig} source={source} />)}
      </div>
    </div>
  )
}

// ── Scan animation ─────────────────────────────────────────────────────────
const SCAN_STEPS = [
  { domain: 'reddit.com',           label: 'Scraping Reddit posts…' },
  { domain: 'apple.com',            label: 'Reading App Store reviews…' },
  { domain: 'news.ycombinator.com', label: 'Scanning HackerNews…' },
  { domain: 'anthropic.com',        label: 'Claude is analyzing signals…' },
  { domain: 'nicheagent.app',       label: 'Finding startup opportunities…' },
]

function ScanAnimation() {
  const [idx, setIdx] = useState(0)
  const [dots, setDots] = useState('.')
  useEffect(() => {
    const t1 = setInterval(() => setIdx(i => Math.min(i+1, SCAN_STEPS.length-1)), 8000)
    const t2 = setInterval(() => setDots(d => d.length >= 3 ? '.' : d+'.'), 500)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])
  const step = SCAN_STEPS[idx]
  return (
    <div className="bg-white border border-black/10 rounded-xl p-6 text-center mb-5">
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 rounded-full bg-[#EEEDFE] flex items-center justify-center">
          <Favicon domain={step.domain} size={24} />
        </div>
      </div>
      <p className="text-[15px] font-black text-[#0f0f0f] mb-1">{step.label}{dots}</p>
      <p className="text-[12px] font-semibold text-neutral-400 mb-4">This takes 3–5 minutes. Results appear automatically.</p>
      <div className="flex gap-1.5 justify-center">
        {SCAN_STEPS.map((_, i) => (
          <div key={i} className={clsx('h-1 rounded-full transition-all duration-500', i <= idx ? 'bg-[#534AB7] w-6' : 'bg-neutral-200 w-3')} />
        ))}
      </div>
    </div>
  )
}

// ── Hot banners ────────────────────────────────────────────────────────────
function HotBanners({ niches }: { niches: any[] }) {
  if (niches.length < 3) return null
  const hottest  = [...niches].sort((a,b) => b.signal_score - a.signal_score)[0]
  const fastest  = [...niches].sort((a,b) => a.mvp_weeks - b.mvp_weeks)[0]
  const cheapest = niches.find(n => n.competition === 'low') || niches[niches.length-1]
  const banners = [
    { icon: Flame,       label: 'Hottest signal',    niche: hottest,  bg: '#FCEBEB', color: '#A32D2D', border: '#F09595' },
    { icon: Clock,       label: 'Fastest to ship',   niche: fastest,  bg: '#E6F1FB', color: '#0C447C', border: '#85B7EB' },
    { icon: DollarSign,  label: 'Least competition', niche: cheapest, bg: '#EAF3DE', color: '#27500A', border: '#97C459' },
  ]
  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {banners.map(({ icon: Icon, label, niche, bg, color, border }) => (
        <Link key={label} href={`/niche/${niche.id}`}
          className="rounded-xl border p-4 hover:shadow-sm transition-all"
          style={{ background: bg, borderColor: border }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Icon size={13} style={{ color }} />
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color }}>{label}</span>
          </div>
          <p className="text-[13px] font-black text-[#0f0f0f] leading-snug line-clamp-2">{niche.name}</p>
          <div className="flex gap-2 mt-2">
            <span className="text-[10px] font-bold" style={{ color }}>Signal {niche.signal_score}</span>
            <span className="text-[10px] font-bold text-neutral-400">{niche.mvp_weeks}w MVP</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

// ── Scan modal ─────────────────────────────────────────────────────────────
function ScanModal({ onClose, onStart }: { onClose:()=>void; onStart:(q:string[])=>void }) {
  const [query, setQuery] = useState('')
  const [chips, setChips] = useState<string[]>(['micro saas', 'solopreneur tools'])
  const add = () => { const v = query.trim(); if (v && !chips.includes(v)) setChips(c=>[...c,v]); setQuery('') }
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-black/10 w-full max-w-[420px] p-6" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-black text-[#0f0f0f]">New scan</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors"><X size={14}/></button>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Topics to scan</p>
          <div className="flex gap-2">
            <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}
              placeholder="e.g. B2B invoicing..."
              className="flex-1 px-3 py-2 text-[13px] bg-[#F2F0EB] border border-black/10 rounded-lg text-[#0f0f0f] focus:outline-none focus:ring-1 focus:ring-[#0f0f0f]" />
            <button onClick={add} className="px-3 py-2 border border-black/12 rounded-lg text-[12px] font-bold text-neutral-600 hover:border-black/25 bg-white transition-colors">Add</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chips.map(c => (
              <span key={c} className="flex items-center gap-1 text-[11px] font-bold bg-[#EEEDFE] text-[#3C3489] px-2.5 py-1 rounded-lg">
                {c}<button onClick={()=>setChips(x=>x.filter(v=>v!==c))}><X size={9}/></button>
              </span>
            ))}
          </div>
          <button onClick={()=>{onStart(chips);onClose()}}
            className="w-full py-3 bg-[#0f0f0f] text-white rounded-xl text-[14px] font-black hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
            <Zap size={15}/> Start scan →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Niche card ─────────────────────────────────────────────────────────────
function NicheCard({ niche, saved, onSave }: { niche: any; saved: boolean; onSave: ()=>void }) {
  return (
    <Link href={`/niche/${niche.id}`} className="block">
      <div className="bg-white border border-black/10 rounded-xl p-4 hover:border-black/20 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-3">
            <div className="text-center">
              <p className="text-[9px] font-black text-[#D85A30] uppercase tracking-wider">Signal</p>
              <p className="text-[22px] font-black text-[#D85A30] leading-none">{niche.signal_score}</p>
            </div>
            <div className="text-center pl-3 border-l border-black/8">
              <p className="text-[9px] font-black text-[#534AB7] uppercase tracking-wider">Fit</p>
              <p className="text-[22px] font-black text-[#534AB7] leading-none">{niche.fit_score}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">{niche.category}</span>
            <button onClick={e=>{e.preventDefault();onSave()}}
              className={clsx('p-1 rounded-md transition-colors', saved ? 'text-[#534AB7]' : 'text-neutral-300 hover:text-neutral-600')}>
              {saved ? <BookmarkCheck size={14}/> : <Bookmark size={14}/>}
            </button>
          </div>
        </div>
        <h3 className="text-[15px] font-black text-[#0f0f0f] mb-1.5 leading-snug">{niche.name}</h3>
        <p className="text-[12px] font-semibold text-neutral-500 leading-relaxed mb-3 line-clamp-2">{niche.why_summary}</p>
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">{niche.mvp_weeks}w MVP</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
            style={{ color: compColor[niche.competition], background: compBg[niche.competition] }}>
            {niche.competition}
          </span>
          {niche.tags?.slice(0,2).map((tag: string) => (
            <span key={tag} className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all', label: 'All niches', dot: '' },
  { id: 'AI & SaaS', label: 'AI & SaaS', dot: '#534AB7' },
  { id: 'Health tech', label: 'Health tech', dot: '#E24B4A' },
  { id: 'B2B tools', label: 'B2B tools', dot: '#BA7517' },
  { id: 'Dev tools', label: 'Dev tools', dot: '#185FA5' },
  { id: 'Creator', label: 'Creator', dot: '#3B6D11' },
]

function Sidebar({ category, setCategory, sort, setSort, counts, scanning }: any) {
  return (
    <aside className="w-[192px] flex-shrink-0 bg-[#F2F0EB] border-r border-black/8 flex flex-col py-3">
      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider px-4 mb-1">Browse</p>
      {CATEGORIES.map(cat => (
        <button key={cat.id} onClick={() => setCategory(cat.id)}
          className={clsx('flex items-center gap-2.5 px-4 py-2 mx-2 rounded-lg text-[13px] font-semibold transition-all',
            category === cat.id ? 'bg-[#0f0f0f] text-white font-black' : 'text-neutral-600 hover:bg-black/5')}>
          {cat.dot ? <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.dot }} /> : <div className="w-2 h-2 flex-shrink-0" />}
          <span className="flex-1 text-left">{cat.label}</span>
          <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded-md',
            category === cat.id ? 'bg-white/20 text-white' : 'bg-black/6 text-neutral-500')}>
            {counts[cat.id] ?? 0}
          </span>
        </button>
      ))}
      <div className="mx-4 my-3 border-t border-black/8" />
      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider px-4 mb-1">Sort by</p>
      {[['signal_score','Signal score'],['fit_score','Fit score'],['mvp_weeks','Time to MVP']].map(([id,label]) => (
        <button key={id} onClick={() => setSort(id)}
          className={clsx('flex items-center gap-2 px-4 py-2 mx-2 rounded-lg text-[13px] transition-all',
            sort === id ? 'bg-white border border-black/10 font-black text-[#0f0f0f]' : 'text-neutral-500 hover:bg-black/5 font-semibold')}>
          <TrendingUp size={13} className={sort===id ? 'text-[#534AB7]' : 'text-neutral-400'} />
          {label}
          {sort===id && <span className="ml-auto text-[9px] font-black bg-[#0f0f0f] text-white px-1.5 py-0.5 rounded-md">TOP</span>}
        </button>
      ))}
      <div className="mt-auto px-4 py-3 border-t border-black/8">
        {scanning
          ? <div className="flex items-center gap-2 text-[12px] font-semibold text-neutral-500"><Loader2 size={12} className="animate-spin"/>Scanning…</div>
          : <div className="flex items-center gap-2 text-[12px] font-semibold text-neutral-400"><div className="w-1.5 h-1.5 rounded-full bg-neutral-300"/>Ready</div>
        }
      </div>
    </aside>
  )
}

// ── Topbar ─────────────────────────────────────────────────────────────────
function Topbar({ scanning }: { scanning: boolean }) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-black/10 h-[52px] flex items-center px-5 gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-[27px] h-[27px] bg-[#0f0f0f] rounded-[7px] flex items-center justify-center">
          <Radio size={14} className="text-white" />
        </div>
        <span className="text-[16px] font-black tracking-tight text-[#0f0f0f]">NicheAgent</span>
      </div>
      <nav className="flex gap-0.5 ml-2">
        <Link href="/" className="px-3 py-1.5 text-[13px] font-black rounded-lg text-[#0f0f0f] bg-neutral-100">Discover</Link>
        <Link href="/saved" className="px-3 py-1.5 text-[13px] font-semibold rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors">Saved</Link>
        <Link href="/profile" className="px-3 py-1.5 text-[13px] font-semibold rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors">My profile</Link>
      </nav>
      <div className="ml-auto flex items-center gap-2.5">
        {scanning && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAF3DE] border border-[#97C459]/40">
            <div className="w-1.5 h-1.5 rounded-full bg-[#639922] animate-pulse" />
            <span className="text-[11px] font-bold text-[#27500A]">Scanning</span>
          </div>
        )}
        <Link href="/profile" className="w-8 h-8 rounded-full bg-[#EEEDFE] flex items-center justify-center text-[12px] font-black text-[#534AB7] hover:bg-[#CECBF6] transition-colors">ZL</Link>
      </div>
    </header>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('signal_score')
  const [scanning, setScanning] = useState(false)
  const [scanId, setScanId]     = useState<string|null>(null)
  const [activeScanId, setActiveScanId] = useState<string|null>(null)
  const [showScan, setShowScan] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [searchQ, setSearchQ]   = useState('')

  const sortParam = sort === 'created_at' ? 'signal_score' : sort
  const apiUrl = category === 'all'
    ? `${API}/api/niches/?sort=${sortParam}&limit=50`
    : `${API}/api/niches/?sort=${sortParam}&limit=50&category=${encodeURIComponent(category)}`

  const { data: niches = [], isLoading, mutate } = useSWR<any[]>(apiUrl, fetcher, {
    refreshInterval: scanning ? 5000 : 0,
  })

  useEffect(() => {
    if (!scanId || !scanning) return
    const t = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/niches/scan/${scanId}`)
        const d = await res.json()
        if (d.status === 'done' || d.status === 'failed') {
          setScanning(false)
          setSort('created_at')
          setScanId(null)
          mutate()
        }
      } catch {}
    }, 5000)
    return () => clearInterval(t)
  }, [scanId, scanning])

  const counts: Record<string,number> = {
    all: niches.length,
    'AI & SaaS': niches.filter(n=>n.category==='AI & SaaS').length,
    'Health tech': niches.filter(n=>n.category==='Health tech').length,
    'B2B tools': niches.filter(n=>n.category==='B2B tools').length,
    'Dev tools': niches.filter(n=>n.category==='Dev tools').length,
    'Creator': niches.filter(n=>n.category==='Creator').length,
  }

  const startScan = async (queries: string[]) => {
    setScanning(true)
    try {
      const res = await fetch(`${API}/api/niches/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics: queries }),
      })
      const d = await res.json()
      setScanId(d.id)
      setActiveScanId(d.id)
    } catch { setScanning(false) }
  }

  const sortedNiches = sort === 'created_at'
    ? [...niches].sort((a,b) => new Date((b as any).created_at||0).getTime() - new Date((a as any).created_at||0).getTime())
    : niches

  const filtered = sortedNiches.filter((n: any) => {
    if (activeScanId && n.scan_id && n.scan_id !== activeScanId) return false
    return true
  })

  return (
    <div style={{ fontFamily: "'Poppins', system-ui, sans-serif" }} className="min-h-screen bg-[#F2F0EB]">
      <Topbar scanning={scanning} />

      <div className="flex h-[calc(100vh-52px)]">
        <Sidebar category={category} setCategory={setCategory} sort={sort} setSort={setSort} counts={counts} scanning={scanning} />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-5">

            {/* Search */}
            <div className="bg-white border border-black/10 rounded-xl px-4 py-4 mb-5">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 bg-[#0f0f0f] rounded-[5px] flex items-center justify-center flex-shrink-0">
                  <Zap size={12} className="text-white" />
                </div>
                <h1 className="text-[15px] font-black text-[#0f0f0f]">Discover startup opportunities</h1>
              </div>
              <p className="text-[12px] font-semibold text-neutral-500 mb-3">Search existing or trigger a new AI-powered market scan</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && searchQ.trim()) { startScan([searchQ.trim()]); setSearchQ('') } }}
                    placeholder="Search niches, topics, keywords…"
                    className="w-full pl-9 pr-3 py-2 text-[13px] bg-[#F2F0EB] border border-black/10 rounded-lg text-[#0f0f0f] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#0f0f0f] focus:border-[#0f0f0f] transition-colors"
                  />
                </div>
                <button
                  onClick={() => { if (searchQ.trim()) { startScan([searchQ.trim()]); setSearchQ('') } else { setShowScan(true) } }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0f0f0f] text-white rounded-lg text-[13px] font-black hover:bg-neutral-800 transition-colors flex-shrink-0">
                  <RefreshCw size={13} />
                  {searchQ.trim() ? 'Scan this →' : 'New scan'}
                </button>
              </div>
            </div>

            {/* Hot banners */}
            {niches.length >= 3 && !scanning && <HotBanners niches={niches} />}



            {/* Scan animation */}
            {scanning && <ScanAnimation />}

            {/* Niches grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <p className="text-[14px] font-black text-[#0f0f0f]">Top opportunities</p>
                  {activeScanId && (
                    <button onClick={() => { setActiveScanId(null); setSort('signal_score') }}
                      className="text-[11px] font-bold text-[#534AB7] hover:underline">
                      Show all niches →
                    </button>
                  )}
                </div>
                <p className="text-[12px] font-semibold text-neutral-400">
                  {filtered.length} found · {activeScanId ? 'from this scan' : `by ${sort.replace('_',' ')}`} · Updated live
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-neutral-400" /></div>
              ) : filtered.length === 0 ? (
                <div className="bg-white border border-black/10 rounded-xl px-5 py-12 text-center">
                  <p className="text-[16px] font-black text-neutral-700 mb-1">No niches found yet</p>
                  <p className="text-[13px] font-semibold text-neutral-500 mb-5">Trigger a scan to discover opportunities from Reddit, App Store, HackerNews and more.</p>
                  <button onClick={() => setShowScan(true)}
                    className="inline-flex items-center gap-2 bg-[#0f0f0f] text-white px-5 py-2.5 rounded-xl text-[13px] font-black hover:bg-neutral-800 transition-colors">
                    <Zap size={14} /> Start first scan
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filtered.map((niche: any) => (
                    <NicheCard key={niche.id} niche={niche} saved={savedIds.has(niche.id)} onSave={() => setSavedIds(s => { const n=new Set(s); n.has(niche.id)?n.delete(niche.id):n.add(niche.id); return n })} />
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {showScan && <ScanModal onClose={() => setShowScan(false)} onStart={startScan} />}
    </div>
  )
}
