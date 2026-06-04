'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import clsx from 'clsx'
import {
  ArrowLeft, Bookmark, Check, ExternalLink, ChevronRight,
  ChevronDown, RotateCw, Loader2, TrendingUp, AlertCircle,
  Globe, DollarSign, Clock, Zap, Users, Code2
} from 'lucide-react'
import type { Niche } from '@/types'
import { translations, Lang } from '@/lib/i18n'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const fetcher = (url: string) => fetch(url).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })

const SOURCE_META: Record<string, { label: string; favicon: string }> = {
  reddit:      { label: 'Reddit',        favicon: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=32' },
  trends:      { label: 'Google Trends', favicon: 'https://www.google.com/s2/favicons?domain=trends.google.com&sz=32' },
  producthunt: { label: 'Product Hunt',  favicon: 'https://www.google.com/s2/favicons?domain=producthunt.com&sz=32' },
  meta_ads:    { label: 'Meta Ads',      favicon: 'https://www.google.com/s2/favicons?domain=facebook.com&sz=32' },
  appstore:    { label: 'App Store',     favicon: 'https://www.google.com/s2/favicons?domain=apple.com&sz=32' },
}
const PHASE_COLORS = [
  { bg: '#0f0f0f', text: '#fff', light: '#f5f5f5' },
  { bg: '#534AB7', text: '#fff', light: '#EEEDFE' },
  { bg: '#1D9E75', text: '#fff', light: '#E1F5EE' },
  { bg: '#D85A30', text: '#fff', light: '#FAECE7' },
  { bg: '#BA7517', text: '#fff', light: '#FAEEDA' },
]

function ScoreBox({ label, value, color, why, source, details, bgLight, icon }: {
  label: string; value: any; color: string; why: string; source: string; 
  details?: string[]; bgLight?: string; icon?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border overflow-hidden cursor-pointer" 
         style={{ borderColor: color + '30', background: open ? bgLight : 'white' }}
         onClick={() => setOpen(o => !o)}>
      <div className="px-4 py-3.5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black uppercase tracking-wider" style={{ color }}>{label}</p>
          <ChevronDown size={12} className={clsx('transition-transform', open && 'rotate-180')} style={{ color }} />
        </div>
        <p className="text-[24px] font-black capitalize leading-none" style={{ color }}>{value}</p>
        <p className="text-[10px] font-semibold text-neutral-400 mt-1.5 truncate">{source}</p>
      </div>
      {open && (
        <div className="border-t px-4 py-3 max-h-[200px] overflow-y-auto" style={{ borderColor: color + '20', background: bgLight }}>
          <p className="text-[12px] font-bold leading-relaxed mb-2" style={{ color }}>{why}</p>
          {details?.map((d, i) => (
            <div key={i} className="flex gap-2 items-start mb-2 bg-white/60 rounded-lg px-2.5 py-2">
              <span className="font-black text-[12px] shrink-0" style={{ color }}>→</span>
              <p className="text-[12px] font-semibold text-neutral-700 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CompetitorSection({ competitors }: { competitors: any[] }) {
  const [current, setCurrent] = useState(0)
  if (!competitors?.length) return (
    <div className="bg-white rounded-xl border border-black/10 px-5 py-8 text-center">
      <p className="text-[14px] font-semibold text-neutral-500">No competitor data yet — run a scan to load intelligence</p>
    </div>
  )
  const comp = competitors[current]
  const rawDomain = comp.website?.replace(/^https?:\/\//, '').split('/')[0]
  const faviconUrl = rawDomain ? `https://www.google.com/s2/favicons?domain=${rawDomain}&sz=64` : null
  const websiteUrl = comp.website ? (comp.website.startsWith('http') ? comp.website : `https://${comp.website}`) : null

  return (
    <div>
      {/* Tab switcher ABOVE card */}
      {competitors.length > 1 && (
        <div className="flex gap-2 mb-3">
          {competitors.map((c: any, i: number) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={clsx('flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-bold transition-all border',
                i === current
                  ? 'bg-[#0f0f0f] text-white border-[#0f0f0f]'
                  : 'bg-white text-neutral-600 border-black/10 hover:border-black/20'
              )}>
              {c.website && (
                <img src={`https://www.google.com/s2/favicons?domain=${c.website.replace(/^https?:\/\//,'').split('/')[0]}&sz=16`}
                     className="w-4 h-4 rounded-sm" alt=""
                     onError={e => ((e.currentTarget as HTMLImageElement).style.display='none')} />
              )}
              {c.name}
            </button>
          ))}
          <span className="ml-auto text-[12px] font-semibold text-neutral-400 self-center">{current+1}/{competitors.length}</span>
        </div>
      )}

      {/* Main competitor card */}
      <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-5 py-5 border-b border-black/8">
          <div className="w-16 h-16 rounded-xl bg-neutral-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-black/8">
            {faviconUrl
              ? <img src={faviconUrl} alt={comp.name} className="w-14 h-14 rounded-lg object-contain"
                     onError={e => { (e.currentTarget as HTMLImageElement).style.display='none' }} />
              : <span className="text-[20px] font-black text-neutral-400">{comp.name?.slice(0,2)}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[18px] font-black text-[#0f0f0f] mb-1.5">{comp.name}</h3>
            <div className="flex gap-2 flex-wrap">
              {comp.arr_estimate && (
                <span className="text-[12px] font-bold px-2.5 py-1 rounded-full bg-[#EAF3DE] text-[#173404]">
                  {comp.arr_estimate}
                </span>
              )}
              {comp.funding && (
                <span className="text-[12px] font-bold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600">
                  {comp.funding}
                </span>
              )}
              {comp.founded_year && (
                <span className="text-[12px] font-semibold text-neutral-400">est. {comp.founded_year}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            {websiteUrl && (
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-black/12 text-[12px] font-bold text-neutral-700 hover:bg-neutral-50 transition-colors">
                <Globe size={12} /> Website <ExternalLink size={10} />
              </a>
            )}
            {comp.ph_url && (
              <a href={comp.ph_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FF6154] text-white text-[12px] font-bold hover:bg-[#e5564c] transition-colors">
                <img src="https://www.google.com/s2/favicons?domain=producthunt.com&sz=16" className="w-3.5 h-3.5" alt="" />
                Product Hunt
              </a>
            )}
          </div>
        </div>

        {/* Screenshot placeholder — real screenshots need screenshotone.com API */}
        <div className="bg-neutral-50 border-b border-black/8 px-5 py-3 flex items-center gap-2">
          <div className="flex-1 h-[100px] bg-neutral-100 rounded-lg flex items-center justify-center border border-black/6">
            <div className="text-center">
              <p className="text-[11px] font-bold text-neutral-400">Product screenshot</p>
              {websiteUrl && (
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer"
                   className="text-[11px] font-bold text-[#534AB7] hover:underline flex items-center gap-1 justify-center mt-1">
                  Open {rawDomain} <ExternalLink size={9} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Gaps */}
        <div className="px-5 py-4">
          <p className="text-[11px] font-black text-[#993C1D] uppercase tracking-wider mb-3">Exploitable gaps</p>
          <div className="space-y-2">
            {(comp.gaps?.length ? comp.gaps : comp.key_weakness ? [comp.key_weakness] : ['No gap data']).map((g: string, i: number) => (
              <div key={i} className="flex gap-3 items-start bg-[#FAECE7] rounded-lg px-3 py-2.5">
                <span className="text-[#D85A30] font-black text-[15px] flex-shrink-0">→</span>
                <p className="text-[13px] font-semibold text-[#4A1B0C] leading-relaxed">{g}</p>
              </div>
            ))}
          </div>
          {comp.strengths?.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-black text-[#3B6D11] uppercase tracking-wider mb-2">Their strengths (watch out)</p>
              <div className="space-y-1.5">
                {comp.strengths.map((s: string, i: number) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-emerald-600 font-bold text-[13px] shrink-0">✓</span>
                    <p className="text-[12px] font-semibold text-neutral-600 leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const TABS = ['Competitors', 'Sources', 'Roadmap', 'Adjacent']

export default function NichePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab]         = useState(0)
  const [saved, setSaved]     = useState(false)
  const [lang, setLang]       = useState<Lang>('en')
  const [openSignal, setOpenSignal] = useState<string|null>(null)
  const [flipped, setFlipped] = useState<Record<number,boolean>>({})
  const [budget, setBudget]   = useState('bootstrap')
  const [team, setTeam]       = useState('solo')
  const [weeks, setWeeks]     = useState(5)
  const [roadmap, setRoadmap] = useState<any>(null)
  const [loadingRm, setLoadingRm] = useState(false)
  const [rmError, setRmError] = useState('')

  const t = translations[lang]

  const { data: niche, isLoading, error } = useSWR<Niche & { signals: any[]; competitors: any[] }>(
    `${API}/api/niches/${id}`, fetcher
  )

  const loadRoadmap = async () => {
    setLoadingRm(true); setRmError('')
    try {
      const r = await fetch(
        `${API}/api/niches/${id}/roadmap?budget=${budget}&team=${team}&timeline_weeks=${weeks}`
      )
      const text = await r.text()
      let data: any
      try { data = JSON.parse(text) } catch {
        // Try to extract JSON from markdown
        const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (match) data = JSON.parse(match[1])
        else throw new Error('Invalid JSON from API')
      }
      if (data?.detail) throw new Error(data.detail)
      setRoadmap(data)
    } catch (e: any) {
      setRmError(e.message || 'Failed to generate. Check backend is running.')
    } finally { setLoadingRm(false) }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen bg-[#F2F0EB]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={28} className="animate-spin text-neutral-400" />
        <p className="text-[14px] font-bold text-neutral-500">Loading niche…</p>
      </div>
    </div>
  )
  if (error || !niche) return (
    <div className="flex items-center justify-center h-screen bg-[#F2F0EB]">
      <div className="text-center">
        <p className="text-[16px] font-black text-neutral-900 mb-2">Niche not found</p>
        <button onClick={() => router.back()} className="text-[14px] text-[#534AB7] font-bold hover:underline">← Back</button>
      </div>
    </div>
  )

  const compCount = niche.competition === 'low' ? '0–1 funded'
    : niche.competition === 'medium' ? '2–4 players, <$5M ARR'
    : '5+ players or dominant leader'

  const SCORE_BOXES = [
    {
      label: 'Signal strength', value: niche.signal_score, color: '#D85A30', bgLight: '#FAECE7',
      why: 'Composite score from post volume, upvotes, comment density, recency and cross-source validation.',
      source: 'Reddit + Trends + PH',
      details: [
        'Pain point clustering: same problem appearing across 3+ subreddits',
        'Recency weight: posts from last 7 days score 3× higher',
        'Upvote velocity: ratio of score to post age (signals rising demand)',
        'Cross-source bonus: +15 pts if confirmed by both Reddit and Trends',
      ]
    },
    {
      label: 'Operational fit', value: niche.fit_score, color: '#534AB7', bgLight: '#EEEDFE',
      why: 'How buildable this is for a solo/small team without enterprise resources.',
      source: 'internal model',
      details: [
        'API availability: all required data sources have public APIs',
        'Technical complexity: uses standard SaaS patterns, no novel ML needed',
        'Regulatory risk: no healthcare, fintech or legal compliance required',
        'Distribution path: clear channel exists (Reddit community, PH launch)',
      ]
    },
    {
      label: 'Time to MVP', value: `${niche.mvp_weeks}w`, color: '#0F6E56', bgLight: '#E1F5EE',
      why: `${niche.mvp_weeks} weeks estimated for solo bootstrap profile: validation → build → launch.`,
      source: 'industry benchmarks',
      details: [
        'Week 1: customer discovery — 10 user interviews',
        `Weeks 2–${Math.max(3, niche.mvp_weeks-2)}: core product build with existing APIs`,
        `Week ${niche.mvp_weeks-1}: private beta with 20 users`,
        `Week ${niche.mvp_weeks}: public launch on Product Hunt`,
      ]
    },
    {
      label: 'Competition', value: niche.competition, color:
        niche.competition === 'low' ? '#3B6D11' : niche.competition === 'medium' ? '#854F0B' : '#A32D2D',
      why: `Market structure: ${compCount}.`,
      source: 'Crunchbase + PH + CB Insights',
      details: [
        `Competitor count: ${niche.competitors?.length ?? 0} identified in this scan`,
        niche.competition === 'low' ? 'No funded dominant player — first mover advantage available'
          : niche.competition === 'medium' ? 'Growing market with gaps — differentiation is key'
          : 'Mature market — requires strong differentiation to enter',
        'New entrant velocity: checked PH launches last 90 days',
        'Funding activity: checked Crunchbase for recent rounds in this niche',
      ]
    },
  ]

  return (
    <div style={{ fontFamily: "'Poppins', system-ui, sans-serif" }} className="min-h-screen bg-[#F2F0EB]">
      {/* Topbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-black/10 px-5 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[13px] font-bold text-neutral-600 hover:text-neutral-900 transition-colors shrink-0">
          <ArrowLeft size={15} /> Back
        </button>
        <h1 className="text-[14px] font-black text-[#0f0f0f] flex-1 min-w-0 truncate">{niche.name}</h1>
        <div className="flex gap-2 shrink-0 items-center">
          <button onClick={() => setLang(l => l === 'en' ? 'ua' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-black/12
                       text-[12px] font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">
            <Globe size={13} />{lang === 'en' ? 'UA' : 'EN'}
          </button>
          <button onClick={() => setSaved(s => !s)}
            className={clsx('flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[13px] font-bold transition-all',
              saved ? 'bg-[#EEEDFE] border-[#AFA9EC] text-[#534AB7]' : 'border-black/12 text-neutral-700 hover:bg-neutral-50'
            )}>
            {saved ? <Check size={13}/> : <Bookmark size={13}/>}
            {saved ? t.saved : 'Save'}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-6">
        {/* Score boxes — clickable, expand with details */}
        <div className="grid grid-cols-4 gap-2.5 mb-5">
          {SCORE_BOXES.map(box => <ScoreBox key={box.label} {...box} />)}
        </div>

        {/* Why summary */}
        <div className="bg-white rounded-xl border border-black/10 px-5 py-4 mb-5">
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-2">Why this niche</p>
          <p className="text-[14px] font-semibold text-neutral-800 leading-relaxed mb-3">{niche.why_summary}</p>
          <div className="flex gap-2 flex-wrap">
            {niche.tags?.map(tag => (
              <span key={tag} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-black/8">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-black/10 mb-5">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={clsx('px-4 py-2.5 text-[13px] font-black border-b-2 transition-colors',
                tab === i ? 'border-[#0f0f0f] text-[#0f0f0f]' : 'border-transparent text-neutral-500 hover:text-neutral-700'
              )}>
              {t}
            </button>
          ))}
        </div>

        {/* COMPETITORS */}
        {tab === 0 && <CompetitorSection competitors={niche.competitors ?? []} />}

        {/* SOURCES */}
        {tab === 1 && (
          <div className="space-y-2">
            {(!niche.signals?.length) && (
              <div className="bg-white rounded-xl border border-black/10 px-5 py-8 text-center">
                <p className="text-[15px] font-bold text-neutral-700 mb-1">No signals loaded</p>
                <p className="text-[13px] font-semibold text-neutral-500">Trigger a new scan to load live source data.</p>
              </div>
            )}
            {niche.signals?.map((sig: any, i: number) => {
              const meta = SOURCE_META[sig.source] ?? SOURCE_META.reddit
              const isOpen = openSignal === (sig.id ?? i.toString())
              return (
                <div key={sig.id ?? i}
                  onClick={() => setOpenSignal(isOpen ? null : (sig.id ?? i.toString()))}
                  className={clsx('rounded-xl border cursor-pointer transition-all bg-white',
                    isOpen ? 'border-[#0f0f0f]' : 'border-black/10 hover:border-black/20'
                  )}>
                  <div className="flex items-start gap-3 px-4 py-4">
                    <img src={meta.favicon} alt={meta.label} className="w-7 h-7 rounded-lg mt-0.5 shrink-0"
                         onError={e => ((e.currentTarget as HTMLImageElement).style.display='none')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#0f0f0f] leading-snug mb-1">{sig.title}</p>
                      <div className="flex gap-2 items-center flex-wrap">
                        {sig.metadata?.score && <span className="text-[11px] font-bold text-neutral-500">↑ {sig.metadata.score}</span>}
                        {sig.metadata?.subreddit && <span className="text-[11px] font-bold text-neutral-500">r/{sig.metadata.subreddit}</span>}
                        {sig.metadata?.num_comments && <span className="text-[11px] font-bold text-neutral-500">{sig.metadata.num_comments} comments</span>}
                        {sig.source_url && (
                          <a href={sig.source_url} target="_blank" rel="noopener noreferrer"
                             onClick={e => e.stopPropagation()}
                             className="text-[11px] font-black text-[#534AB7] hover:underline flex items-center gap-1">
                            Open original <ExternalLink size={9}/>
                          </a>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={15} className={clsx('text-neutral-400 shrink-0 mt-1 transition-transform', isOpen && 'rotate-90')} />
                  </div>
                  {isOpen && sig.content && (
                    <div className="px-4 pb-4 border-t border-black/8 pt-3">
                      <p className="text-[13px] font-semibold text-neutral-700 leading-relaxed">{sig.content}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ROADMAP */}
        {tab === 2 && (
          <div>
            <div className="bg-white rounded-xl border border-black/10 p-4 mb-5 space-y-3">
              {[
                { label: 'Budget', key: 'budget', val: budget, set: setBudget,
                  opts: [['bootstrap','Bootstrap'],['small','$1–5k'],['funded','$5k+']] },
                { label: 'Team', key: 'team', val: team, set: setTeam,
                  opts: [['solo','Solo'],['two','2 people'],['small','3–5']] },
                { label: 'Timeline', key: 'weeks', val: String(weeks), set: (v:string)=>setWeeks(Number(v)),
                  opts: [['2','2 weeks'],['5','5 weeks'],['8','8 weeks']] },
              ].map(({ label, key, val, set, opts }) => (
                <div key={key}>
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1.5">{label}</p>
                  <div className="flex gap-2">
                    {opts.map(([v,l]) => (
                      <button key={v} onClick={() => (set as any)(v)}
                        className={clsx('flex-1 py-2 rounded-lg text-[12px] font-bold border transition-all',
                          val===v ? 'bg-[#0f0f0f] text-white border-[#0f0f0f]' : 'border-black/12 text-neutral-700 hover:border-black/25'
                        )}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={loadRoadmap} disabled={loadingRm}
                className="w-full py-3 bg-[#0f0f0f] text-white rounded-xl text-[14px] font-black
                           hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed">
                {loadingRm ? <><Loader2 size={15} className="animate-spin"/>Generating with Claude AI…</> : 'Generate personalized roadmap →'}
              </button>
              {rmError && (
                <div className="flex items-start gap-2 bg-[#FCEBEB] rounded-lg px-3 py-2.5">
                  <AlertCircle size={14} className="text-[#A32D2D] shrink-0 mt-0.5"/>
                  <p className="text-[12px] font-bold text-[#501313]">{rmError}</p>
                </div>
              )}
            </div>

            {roadmap && (
              <>
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  {[
                    { icon: DollarSign, label: 'Monthly cost', value: roadmap.total_monthly_cost, color: '#D85A30' },
                    { icon: Users,      label: 'Break-even',   value: `${roadmap.break_even_customers} customers`, color: '#534AB7' },
                    { icon: Zap,        label: 'Pricing',      value: roadmap.pricing_recommendation?.split('—')[0]?.split('–')[0] ?? '—', color: '#0F6E56' },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="bg-white rounded-xl border border-black/10 px-4 py-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Icon size={12} style={{color}} />
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">{label}</p>
                      </div>
                      <p className="text-[17px] font-black text-[#0f0f0f]">{value}</p>
                    </div>
                  ))}
                </div>

                {roadmap.tech_stack && (
                  <div className="bg-white rounded-xl border border-black/10 px-4 py-3 mb-4 flex items-start gap-2.5">
                    <Code2 size={15} className="text-[#534AB7] shrink-0 mt-0.5"/>
                    <div>
                      <p className="text-[11px] font-black text-neutral-500 uppercase tracking-wider mb-1">Tech stack</p>
                      <p className="text-[13px] font-semibold text-neutral-800">{roadmap.tech_stack}</p>
                    </div>
                  </div>
                )}

                {roadmap.first_customer_channel && (
                  <div className="bg-[#EEEDFE] rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5">
                    <TrendingUp size={15} className="text-[#534AB7] shrink-0 mt-0.5"/>
                    <div>
                      <p className="text-[11px] font-black text-[#3C3489] uppercase tracking-wider mb-0.5">First customer channel</p>
                      <p className="text-[13px] font-bold text-[#26215C]">{roadmap.first_customer_channel}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {roadmap.phases?.map((phase: any, i: number) => {
                    const c = PHASE_COLORS[i % PHASE_COLORS.length]
                    const isFlipped = flipped[i]
                    return (
                      <div key={i} style={{perspective:'1000px'}} className="cursor-pointer h-[200px] relative"
                        onClick={() => setFlipped(f=>({...f,[i]:!f[i]}))}>
                        <div style={{transformStyle:'preserve-3d',transition:'transform .4s cubic-bezier(.4,0,.2,1)',
                          transform: isFlipped?'rotateY(180deg)':'rotateY(0deg)'}} className="absolute inset-0">
                          <div style={{backfaceVisibility:'hidden',WebkitBackfaceVisibility:'hidden',background:c.bg,color:c.text}}
                            className="absolute inset-0 rounded-xl p-5 flex flex-col">
                            <p className="text-[10px] font-black mb-2 opacity-60 uppercase tracking-wider">{phase.week_label}</p>
                            <p className="text-[16px] font-black mb-2 leading-snug">{phase.title}</p>
                            <p className="text-[12px] font-semibold opacity-75 leading-relaxed flex-1 line-clamp-3">{phase.why}</p>
                            <div className="flex items-center gap-1.5 mt-2 opacity-40">
                              <RotateCw size={11}/><span className="text-[11px] font-bold">tap for tasks & tools</span>
                            </div>
                          </div>
                          <div style={{backfaceVisibility:'hidden',WebkitBackfaceVisibility:'hidden',transform:'rotateY(180deg)',background:c.light}}
                            className="absolute inset-0 rounded-xl p-4 overflow-y-auto">
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-2">{phase.week_label} · Tasks</p>
                            {phase.tasks?.slice(0,3).map((task:string,ti:number) => (
                              <div key={ti} className="flex gap-2 items-start mb-1.5">
                                <span className="text-emerald-600 font-black text-[13px] shrink-0">✓</span>
                                <p className="text-[12px] font-bold text-neutral-700 leading-relaxed">{task}</p>
                              </div>
                            ))}
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1.5 mt-3">Tools</p>
                            {phase.tools?.slice(0,2).map((tool:any,ti:number) => (
                              <div key={ti} className="flex items-center justify-between mb-1">
                                <a href={tool.url} target="_blank" rel="noopener noreferrer"
                                   onClick={e=>e.stopPropagation()}
                                   className="text-[12px] font-black text-[#534AB7] hover:underline">{tool.name}</a>
                                <span className="text-[12px] font-bold text-neutral-500">{tool.cost}</span>
                              </div>
                            ))}
                            {phase.risks?.[0] && (
                              <p className="text-[11px] font-black text-[#854F0B] bg-[#FAEEDA] rounded-lg px-2.5 py-1.5 mt-2">
                                ⚠ {phase.risks[0]}
                              </p>
                            )}
                            {phase.success_metric && (
                              <p className="text-[11px] font-black text-[#0F6E56] bg-[#E1F5EE] rounded-lg px-2.5 py-1.5 mt-1.5">
                                ✓ Done: {phase.success_metric}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ADJACENT */}
        {tab === 3 && (
          <div className="bg-white rounded-xl border border-black/10 px-5 py-8 text-center">
            <p className="text-[15px] font-bold text-neutral-700 mb-2">Adjacent analysis coming next scan</p>
            <p className="text-[13px] font-semibold text-neutral-500 max-w-sm mx-auto">
              The next scan will map adjacent niches using pattern clustering across all 5 sources.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
