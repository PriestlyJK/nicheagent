'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import clsx from 'clsx'
import {
  Radio, Globe, Bookmark, BookmarkCheck, ArrowRight, ChevronRight,
  Search, Zap, TrendingUp, Star, ExternalLink, Loader2, RefreshCw,
  AlertCircle, X, SlidersHorizontal, Check,
} from 'lucide-react'
import { translations, Lang } from '@/lib/i18n'
import type { Niche } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const fetcher = (url: string) => fetch(url).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })

// ── Source config ──────────────────────────────────────────────────────────
const SOURCES = [
  {
    id: 'reddit',
    label: 'Reddit',
    favicon: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=32',
    accentBg: '#FCEBEB',
    accentText: '#A32D2D',
    accentBorder: '#F09595',
  },
  {
    id: 'appstore',
    label: 'App Store',
    favicon: 'https://www.google.com/s2/favicons?domain=apple.com&sz=32',
    accentBg: '#E6F1FB',
    accentText: '#0C447C',
    accentBorder: '#85B7EB',
  },
  {
    id: 'twitter',
    label: 'X / Twitter',
    favicon: 'https://www.google.com/s2/favicons?domain=twitter.com&sz=32',
    accentBg: '#EAF3DE',
    accentText: '#27500A',
    accentBorder: '#97C459',
  },
  {
    id: 'trends',
    label: 'Google Trends',
    favicon: 'https://www.google.com/s2/favicons?domain=trends.google.com&sz=32',
    accentBg: '#FAEEDA',
    accentText: '#633806',
    accentBorder: '#EF9F27',
  },
] as const

type SourceId = typeof SOURCES[number]['id']

// ── Sidebar categories ─────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',     label: 'All niches',   dot: null },
  { id: 'ai',      label: 'AI & SaaS',    dot: '#534AB7' },
  { id: 'health',  label: 'Health tech',  dot: '#E24B4A' },
  { id: 'b2b',     label: 'B2B tools',    dot: '#BA7517' },
  { id: 'dev',     label: 'Dev tools',    dot: '#185FA5' },
  { id: 'creator', label: 'Creator',      dot: '#3B6D11' },
] as const

const SORT_OPTIONS = [
  { id: 'signal_score', label: 'Signal score' },
  { id: 'fit_score',    label: 'Fit score' },
  { id: 'mvp_weeks',    label: 'Time to MVP' },
]

// ── Fake signal data for sliders (until real scan) ────────────────────────
const DEMO_SIGNALS: Record<SourceId, any[]> = {
  reddit: [
    { id: 'r1', source: 'reddit', sub: 'r/indiehackers', author: 'u/indie_maker_92', score: 847, comments: 134, source_url: 'https://www.reddit.com/r/indiehackers/', title: 'I spend 3 hours every Monday pulling metrics from 6 tools into a spreadsheet', quote: 'I spend 3 hours every Monday manually pulling metrics from 6 different tools into a Google Sheet. There has to be a better way. Every dashboard tool I\'ve tried either costs $300+/mo or requires a developer.', idea: 'Lightweight metrics aggregator for solopreneurs', budget: '$8k–15k', mvp: '8w', competition: 'medium', signal: 88 },
    { id: 'r2', source: 'reddit', sub: 'r/SaaS', author: 'u/saas_builder', score: 612, comments: 89, source_url: 'https://www.reddit.com/r/SaaS/', title: 'Why is every B2B cold email tool designed for teams of 20+?', quote: 'I\'m solo, I just need something that actually delivers and doesn\'t have 400 features I\'ll never use.', idea: 'Solo-founder outreach tool — deliverability-first, $29/mo flat', budget: '$5k–10k', mvp: '6w', competition: 'high', signal: 82 },
    { id: 'r3', source: 'reddit', sub: 'r/nocode', author: 'u/no_code_nina', score: 1203, comments: 201, source_url: 'https://www.reddit.com/r/nocode/', title: 'Zapier breaks silently and I don\'t know until the client complains 3 days later', quote: 'Every time I try to automate my client onboarding it breaks silently. I don\'t know it failed until the client complains 3 days later.', idea: 'Silent failure detector for no-code automations', budget: '$3k–6k', mvp: '5w', competition: 'low', signal: 91 },
    { id: 'r4', source: 'reddit', sub: 'r/microsaas', author: 'u/bootstrapped_dev', score: 489, comments: 67, source_url: 'https://www.reddit.com/r/microsaas/', title: 'No tool that shows me WHERE my exact customer hangs out online', quote: 'I\'ve validated 3 SaaS ideas but always get stuck at "who do I actually target first?" There\'s no tool that shows me WHERE my exact customer hangs out online.', idea: 'ICP locator — finds subreddits, Slack groups, newsletters for your customer', budget: '$6k–12k', mvp: '7w', competition: 'low', signal: 85 },
    { id: 'r5', source: 'reddit', sub: 'r/freelance', author: 'u/freelance_ops', score: 378, comments: 44, source_url: 'https://www.reddit.com/r/freelance/', title: 'Client invoicing is the worst part of my week', quote: 'Chasing payments, writing follow-up emails, manually calculating late fees — I\'m a designer not an accountant.', idea: 'Freelancer invoice autopilot — sends, follows up, charges late fees automatically', budget: '$4k–8k', mvp: '6w', competition: 'medium', signal: 79 },
  ],
  appstore: [
    { id: 'a1', source: 'appstore', app: 'Notion', stars: 1, author: 'JanekM', source_url: 'https://apps.apple.com/app/notion/id1232780281', title: 'Can\'t share one page without forcing visitors to log in — 5 year old request ignored', quote: 'I just want to share one page publicly without forcing visitors to log in. This "feature" has been requested for 5 years. Notion just doesn\'t care about teams under 10.', idea: 'Public-first wiki — zero friction sharing, no login wall, SEO-indexed', budget: '$10k–20k', mvp: '10w', competition: 'high', signal: 85 },
    { id: 'a2', source: 'appstore', app: 'Calendly', stars: 1, author: 'AppUser99', source_url: 'https://apps.apple.com/app/calendly/id1271316900', title: 'Now clients need a Calendly account to book?? Made it HARDER', quote: 'Every client has to create a Calendly account now?? I switched to Calendly to make booking EASIER, not to add another signup barrier.', idea: 'Zero-friction booking — no account needed, payments + reminders included', budget: '$6k–12k', mvp: '7w', competition: 'medium', signal: 80 },
    { id: 'a3', source: 'appstore', app: 'QuickBooks', stars: 1, author: 'SmallBizOps', source_url: 'https://apps.apple.com/app/quickbooks/id584606479', title: 'Designed for accountants, not founders. Show me: am I profitable this month?', quote: 'QuickBooks is designed for an accountant, not a founder. I spend more time figuring out the interface than doing my books.', idea: 'Founder-first P&L — one screen, one answer: profitable or not', budget: '$8k–18k', mvp: '9w', competition: 'high', signal: 88 },
    { id: 'a4', source: 'appstore', app: 'Lemon Squeezy', stars: 1, author: 'IndieDevMo', source_url: 'https://apps.apple.com/us/app/lemon-squeezy/id6449167789', title: 'EU VAT compliance completely broken — hired a freelancer just to figure it out', quote: 'EU VAT compliance is completely broken. I had to hire a freelancer just to figure out what Lemon Squeezy is supposed to handle automatically.', idea: 'EU VAT autopilot for digital products — zero setup, automatic compliance', budget: '$15k–30k', mvp: '14w', competition: 'low', signal: 92 },
    { id: 'a5', source: 'appstore', app: 'Later', stars: 2, author: 'CreatorEco', source_url: 'https://apps.apple.com/app/later/id784375489', title: '$80/mo and still can\'t cross-post Reels to TikTok without reformatting everything', quote: '$80/mo and I still can\'t cross-post Reels to TikTok without reformatting everything manually. The whole point was to save time.', idea: 'True cross-format auto-publisher — adapts video format per platform', budget: '$12k–25k', mvp: '12w', competition: 'high', signal: 83 },
  ],
  twitter: [
    { id: 't1', source: 'twitter', author: '@joannaMakesMRR', source_url: 'https://twitter.com/joannaMakesMRR', title: 'Every AI writing tool produces the same outputs — I can tell which ones use GPT-4 from the first sentence', quote: 'Why does every AI writing tool produce the exact same outputs? I can tell which ones use GPT-4 from the first sentence. My audience can too.', idea: 'Brand voice AI — trained on YOUR content, writes in your exact style', budget: '$8k–15k', mvp: '8w', competition: 'medium', signal: 84 },
    { id: 't2', source: 'twitter', author: '@remote_ops_guy', source_url: 'https://twitter.com/remote_ops_guy', title: 'Onboarded 4 contractors, used 6 tools, sent 23 emails. Still nobody knows what they\'re doing', quote: 'We onboarded 4 contractors last week. Used 6 different tools. Sent 23 emails. Still no one knows what they\'re supposed to be doing.', idea: 'Contractor onboarding OS — single link, all docs, tasks, expectations', budget: '$5k–10k', mvp: '6w', competition: 'medium', signal: 79 },
    { id: 't3', source: 'twitter', author: '@founder_in_EU', source_url: 'https://twitter.com/founder_in_EU', title: 'Launched SaaS in US. Got a GDPR complaint on day 3. Nobody warns solo founders', quote: 'Launched my SaaS in the US. Got a GDPR complaint on day 3. Nobody warns you how brutal European compliance is for a solo founder without a lawyer.', idea: 'GDPR compliance wizard for SaaS — self-serve, plain English, country-specific', budget: '$6k–12k', mvp: '7w', competition: 'low', signal: 87 },
    { id: 't4', source: 'twitter', author: '@contentrepurpose', source_url: 'https://twitter.com/contentrepurpose', title: 'Recorded a 45-min podcast. Need: transcript, clips, LinkedIn post, Twitter thread, email. That\'s a full-time job', quote: 'I recorded a 45-min podcast. I need: transcript, show notes, clips for TikTok, LinkedIn post, Twitter thread, email newsletter. That\'s a full-time job of editing.', idea: 'Podcast → full content suite in 10 min — auto-clips, captions, newsletter draft', budget: '$10k–20k', mvp: '10w', competition: 'high', signal: 86 },
  ],
  trends: [
    { id: 'tr1', source: 'trends', sub: 'Breakout +2400%', source_url: 'https://trends.google.com/trends/explore?q=ai+receptionist', title: '"AI receptionist" up +2400% in 90 days — dental offices, salons, clinics searching', quote: '"AI receptionist" searches up +2400% in 90 days. Small businesses can\'t afford a real receptionist. Searches are from dental offices, salons, clinics.', idea: 'AI receptionist for SMBs — answers calls, books appointments, $49/mo', budget: '$15k–30k', mvp: '12w', competition: 'medium', signal: 94 },
    { id: 'tr2', source: 'trends', sub: 'Breakout +890%', source_url: 'https://trends.google.com/trends/explore?q=llm+cost+tracker', title: '"LLM cost tracker" breakout — developers getting surprise bills from OpenAI', quote: '"LLM cost tracker" breakout. Developers are getting surprise bills from OpenAI. No good tool to forecast or cap costs across providers.', idea: 'LLM cost dashboard — real-time spend, budget alerts, provider comparison', budget: '$4k–8k', mvp: '5w', competition: 'low', signal: 89 },
    { id: 'tr3', source: 'trends', sub: 'Breakout +1800%', source_url: 'https://trends.google.com/trends/explore?q=b2b+whatsapp+crm', title: '"B2B WhatsApp CRM" exploding in LATAM and India', quote: '"B2B WhatsApp CRM" exploding in LATAM and India. Businesses managing clients over WhatsApp with zero tooling.', idea: 'WhatsApp CRM for emerging markets — pipeline in your existing chat', budget: '$12k–25k', mvp: '10w', competition: 'low', signal: 91 },
    { id: 'tr4', source: 'trends', sub: 'Rising +320%', source_url: 'https://trends.google.com/trends/explore?q=micro+saas+ideas', title: '"Micro SaaS ideas" up 320% — people actively searching for validated niches', quote: 'Searches for "micro SaaS ideas 2025" up 320%. People are actively looking for validated niches to build into.', idea: 'NicheAgent — exactly what the market is searching for', budget: '—', mvp: '—', competition: '—', signal: 96 },
  ],
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={10}
          className={i <= count ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}
        />
      ))}
    </div>
  )
}

function SignalCard({ item, src, onOpen, saved, onSave }: {
  item: any; src: typeof SOURCES[number]; onOpen: () => void; saved: boolean; onSave: (e: React.MouseEvent) => void
}) {
  const compColor: Record<string,string> = { low: '#27500A', medium: '#633806', high: '#A32D2D' }
  const compBg:    Record<string,string> = { low: '#EAF3DE', medium: '#FAEEDA', high: '#FCEBEB' }

  return (
    <div
      className="flex-shrink-0 w-[248px] bg-white border border-black/10 rounded-xl p-4 flex flex-col gap-3
                 cursor-pointer hover:border-black/20 hover:shadow-sm transition-all"
      onClick={onOpen}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={src.favicon} alt={src.label}
            className="w-4 h-4 rounded-sm flex-shrink-0"
            onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
          />
          <span className="text-[11px] font-bold" style={{ color: src.accentText }}>
            {item.sub || item.app || item.author || src.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {item.source === 'appstore' && item.stars && <StarRow count={item.stars} />}
          <span
            className="text-[10px] font-black px-1.5 py-0.5 rounded-md"
            style={{ background: src.accentBg, color: src.accentText }}
          >
            {item.signal}
          </span>
        </div>
      </div>

      {/* Quote block */}
      <div
        className="text-[12px] font-semibold leading-relaxed border-l-[3px] pl-2.5 py-0.5"
        style={{ borderColor: src.accentBorder, color: '#3d3d3a', background: src.accentBg + '44' }}
      >
        "{item.quote.slice(0, 120)}{item.quote.length > 120 ? '…' : ''}"
      </div>

      {/* Source link */}
      <a
        href={item.source_url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 hover:text-neutral-700 transition-colors w-fit"
        onClick={e => e.stopPropagation()}
      >
        <ExternalLink size={9} />
        {item.source === 'reddit' ? 'View thread' :
         item.source === 'appstore' ? 'View review' :
         item.source === 'twitter' ? 'View post' : 'View trend'}
      </a>

      {/* Idea pill */}
      <p className="text-[11px] font-bold text-[#3C3489] bg-[#EEEDFE] rounded-lg px-2.5 py-2 leading-snug">
        {item.idea.slice(0, 72)}{item.idea.length > 72 ? '…' : ''}
      </p>

      {/* Metrics */}
      <div className="flex gap-1.5 flex-wrap">
        {item.budget !== '—' && (
          <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
            {item.budget}
          </span>
        )}
        {item.mvp !== '—' && (
          <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
            {item.mvp} MVP
          </span>
        )}
        {item.competition !== '—' && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-md"
            style={{ color: compColor[item.competition] || '#888', background: compBg[item.competition] || '#f5f5f3' }}
          >
            {item.competition}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-black/6 mt-auto">
        <button
          className={clsx(
            'flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-all',
            saved ? 'text-[#534AB7] bg-[#EEEDFE]' : 'text-neutral-500 hover:bg-neutral-100'
          )}
          onClick={onSave}
        >
          {saved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
          {saved ? 'Saved' : 'Save'}
        </button>
        <button className="flex items-center gap-1 text-[11px] font-bold text-neutral-600 hover:text-neutral-900 transition-colors">
          Full idea <ChevronRight size={11} />
        </button>
      </div>
    </div>
  )
}

function SignalSlider({
  src, items, onCardOpen,
  savedIds, onSave, onSeeAll,
}: {
  src: typeof SOURCES[number]
  items: any[]
  onCardOpen: (item: any, src: typeof SOURCES[number]) => void
  savedIds: Set<string>
  onSave: (id: string, e: React.MouseEvent) => void
  onSeeAll: (srcId: SourceId) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 268, behavior: 'smooth' })
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <img
            src={src.favicon} alt={src.label}
            className="w-5 h-5 rounded-md"
            onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
          />
          <span className="text-[14px] font-black text-[#0f0f0f]">{src.label}</span>
          <span className="text-[12px] font-semibold text-neutral-400">{items.length} signals</span>
        </div>
        <button
          onClick={() => onSeeAll(src.id)}
          className="flex items-center gap-1 text-[12px] font-bold text-[#534AB7] hover:text-[#3C3489] transition-colors"
        >
          See all <ChevronRight size={13} />
        </button>
      </div>

      {/* Slider */}
      <div className="relative group">
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10
                     w-7 h-7 rounded-full bg-white border border-black/15 flex items-center justify-center
                     text-neutral-500 hover:text-neutral-900 hover:border-black/30
                     opacity-0 group-hover:opacity-100 transition-all shadow-sm"
          aria-label="Scroll left"
        >
          <ChevronRight size={14} className="rotate-180" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map(item => (
            <SignalCard
              key={item.id}
              item={item}
              src={src}
              onOpen={() => onCardOpen(item, src)}
              saved={savedIds.has(item.id)}
              onSave={(e) => { e.stopPropagation(); onSave(item.id, e) }}
            />
          ))}
          {/* See more card */}
          <div
            className="flex-shrink-0 w-[140px] border border-dashed border-black/15 rounded-xl
                       flex flex-col items-center justify-center gap-2 cursor-pointer
                       hover:border-[#AFA9EC] hover:bg-[#EEEDFE] transition-all p-4"
            onClick={() => onSeeAll(src.id)}
          >
            <ArrowRight size={20} className="text-[#534AB7]" />
            <span className="text-[11px] font-bold text-neutral-500 text-center leading-snug">
              See all {items.length} from {src.label}
            </span>
          </div>
        </div>

        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10
                     w-7 h-7 rounded-full bg-white border border-black/15 flex items-center justify-center
                     text-neutral-500 hover:text-neutral-900 hover:border-black/30
                     opacity-0 group-hover:opacity-100 transition-all shadow-sm"
          aria-label="Scroll right"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Detail modal ───────────────────────────────────────────────────────────
function DetailModal({ item, src, onClose, nicheId }: {
  item: any; src: typeof SOURCES[number]; onClose: () => void; nicheId?: string
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-black/10 w-full max-w-[520px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-black/8">
          <img src={src.favicon} alt={src.label} className="w-5 h-5 rounded-sm flex-shrink-0"
               onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-neutral-500">{item.sub || item.app || item.author || src.label}</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500
                       hover:bg-neutral-200 hover:text-neutral-900 transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Original signal */}
          <div>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-2">
              Original {item.source === 'appstore' ? 'review' : item.source === 'trends' ? 'trend' : 'post'}
            </p>
            <div
              className="text-[13px] font-semibold leading-relaxed border-l-[3px] pl-3 py-1"
              style={{ borderColor: src.accentBorder, background: src.accentBg + '55' }}
            >
              "{item.quote}"
            </div>
            <a
              href={item.source_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-black text-[#534AB7] hover:underline"
            >
              <ExternalLink size={10} />
              View original {item.source === 'appstore' ? 'on App Store' :
                             item.source === 'trends' ? 'on Google Trends' :
                             item.source === 'twitter' ? 'on X/Twitter' : 'on Reddit'}
            </a>
          </div>

          {/* The idea */}
          <div>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-2">The idea</p>
            <p className="text-[14px] font-black text-[#0f0f0f] leading-snug bg-[#EEEDFE] rounded-xl px-4 py-3">
              {item.idea}
            </p>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Budget', value: item.budget },
              { label: 'MVP time', value: item.mvp },
              { label: 'Signal', value: item.signal },
            ].map(({ label, value }) => (
              <div key={label} className="bg-neutral-50 rounded-xl px-3 py-2.5 border border-black/6 text-center">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">{label}</p>
                <p className="text-[17px] font-black text-[#0f0f0f] mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Competitor gaps */}
          <div>
            <p className="text-[10px] font-black text-[#993C1D] uppercase tracking-wider mb-2">Competitor gaps</p>
            <div className="space-y-1.5">
              {['No affordable solo-friendly tier', 'Poor mobile experience', 'No API for power users'].map((gap, i) => (
                <div key={i} className="flex gap-2.5 items-start bg-[#FAECE7] rounded-lg px-3 py-2">
                  <ChevronRight size={12} className="text-[#D85A30] mt-0.5 flex-shrink-0" />
                  <p className="text-[12px] font-semibold text-[#4A1B0C] leading-relaxed">{gap}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-2 pt-1">
            {nicheId ? (
              <Link
                href={`/niche/${nicheId}?tab=2`}
                className="flex-1 py-2.5 bg-[#0f0f0f] text-white rounded-xl text-[13px] font-black
                           hover:bg-neutral-800 transition-colors text-center"
              >
                Generate roadmap →
              </Link>
            ) : (
              <button
                className="flex-1 py-2.5 bg-[#0f0f0f] text-white rounded-xl text-[13px] font-black
                           hover:bg-neutral-800 transition-colors"
              >
                Generate roadmap →
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-black/12 rounded-xl text-[13px] font-bold text-neutral-700
                         hover:bg-neutral-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Scan modal ─────────────────────────────────────────────────────────────
function ScanModal({ onClose, onStart }: { onClose: () => void; onStart: (q: string[]) => void }) {
  const [query, setQuery] = useState('')
  const [chips, setChips] = useState<string[]>(['micro saas', 'solopreneur tools'])
  const [sources, setSrcs] = useState<SourceId[]>(['reddit', 'appstore', 'twitter', 'trends'])

  const addChip = () => {
    const v = query.trim()
    if (v && !chips.includes(v)) setChips(c => [...c, v])
    setQuery('')
  }
  const toggleSrc = (id: SourceId) =>
    setSrcs(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-black/10 w-full max-w-[440px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-black text-[#0f0f0f]">New scan</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center
                                               text-neutral-500 hover:bg-neutral-200 transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-2">Topics to scan</p>
            <div className="flex gap-2 mb-2">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addChip()}
                placeholder="e.g. B2B invoicing..."
                className="input flex-1 text-[13px]"
              />
              <button onClick={addChip} className="btn text-[12px]">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {chips.map(c => (
                <span key={c} className="flex items-center gap-1 text-[11px] font-bold bg-[#EEEDFE] text-[#3C3489]
                                         px-2.5 py-1 rounded-lg">
                  {c}
                  <button onClick={() => setChips(x => x.filter(v => v !== c))} className="ml-0.5 hover:text-[#0f0f0f]">
                    <X size={9} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-2">Sources</p>
            <div className="grid grid-cols-2 gap-2">
              {SOURCES.map(s => (
                <button
                  key={s.id}
                  onClick={() => toggleSrc(s.id)}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-bold transition-all',
                    sources.includes(s.id)
                      ? 'border-[#534AB7] bg-[#EEEDFE] text-[#3C3489]'
                      : 'border-black/10 text-neutral-600 hover:border-black/20'
                  )}
                >
                  <img src={s.favicon} alt={s.label} className="w-4 h-4 rounded-sm"
                       onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
                  {s.label}
                  {sources.includes(s.id) && <Check size={11} className="ml-auto text-[#534AB7]" />}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => { onStart(chips); onClose() }}
            className="w-full py-3 bg-[#0f0f0f] text-white rounded-xl text-[14px] font-black
                       hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
          >
            <Zap size={15} /> Start scan →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Topbar ────────────────────────────────────────────────────────────────
function Topbar({ lang, setLang, scanning }: {
  lang: Lang; setLang: (l: Lang) => void; scanning: boolean
}) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-black/10 h-[52px] flex items-center px-5 gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-[27px] h-[27px] bg-[#0f0f0f] rounded-[7px] flex items-center justify-center">
          <Radio size={14} className="text-white" />
        </div>
        <span className="text-[16px] font-black tracking-tight text-[#0f0f0f]">NicheAgent</span>
      </div>

      <nav className="flex gap-0.5 ml-2">
        <Link href="/"
          className="px-3 py-1.5 text-[13px] font-black rounded-lg text-[#0f0f0f] bg-neutral-100 transition-colors">
          Discover
        </Link>
        <Link href="/saved"
          className="px-3 py-1.5 text-[13px] font-semibold rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
          Saved
        </Link>
        <Link href="/profile"
          className="px-3 py-1.5 text-[13px] font-semibold rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
          My profile
        </Link>
      </nav>

      <div className="ml-auto flex items-center gap-2.5">
        {scanning && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAF3DE] border border-[#97C459]/40">
            <div className="w-1.5 h-1.5 rounded-full bg-[#639922] scan-pulse" />
            <span className="text-[11px] font-bold text-[#27500A]">Scanning</span>
          </div>
        )}
        <button
          onClick={() => setLang(lang === 'en' ? 'ua' : 'en')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-black/12
                     text-[12px] font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <Globe size={13} />
          {lang === 'en' ? 'UA' : 'EN'}
        </button>
        <Link href="/profile"
          className="w-8 h-8 rounded-full bg-[#EEEDFE] flex items-center justify-center
                     text-[12px] font-black text-[#534AB7] hover:bg-[#CECBF6] transition-colors">
          ZL
        </Link>
      </div>
    </header>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({
  category, setCategory, sort, setSort, nicheCounts, scanning,
}: {
  category: string; setCategory: (c: string) => void
  sort: string; setSort: (s: string) => void
  nicheCounts: Record<string, number>; scanning: boolean
}) {
  return (
    <aside className="w-[192px] flex-shrink-0 bg-[#F2F0EB] border-r border-black/8 flex flex-col py-3 gap-0">
      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider px-4 mb-1">Browse</p>
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          onClick={() => setCategory(cat.id)}
          className={clsx(
            'flex items-center gap-2.5 px-4 py-2 mx-2 rounded-lg text-[13px] font-semibold transition-all',
            category === cat.id
              ? 'bg-[#0f0f0f] text-white font-black'
              : 'text-neutral-600 hover:bg-black/5 hover:text-neutral-900'
          )}
        >
          {cat.dot
            ? <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.dot }} />
            : <div className="w-2 h-2 flex-shrink-0" />
          }
          <span className="flex-1 text-left">{cat.label}</span>
          <span className={clsx(
            'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
            category === cat.id ? 'bg-white/20 text-white' : 'bg-black/6 text-neutral-500'
          )}>
            {nicheCounts[cat.id] ?? 0}
          </span>
        </button>
      ))}

      <div className="mx-4 my-3 border-t border-black/8" />

      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider px-4 mb-1">Sort by</p>
      {SORT_OPTIONS.map(opt => (
        <button
          key={opt.id}
          onClick={() => setSort(opt.id)}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 mx-2 rounded-lg text-[13px] transition-all',
            sort === opt.id ? 'bg-white border border-black/10 font-black text-[#0f0f0f]' : 'text-neutral-500 hover:bg-black/5 hover:text-neutral-700 font-semibold'
          )}
        >
          <TrendingUp size={13} className={sort === opt.id ? 'text-[#534AB7]' : 'text-neutral-400'} />
          {opt.label}
          {sort === opt.id && (
            <span className="ml-auto text-[9px] font-black bg-[#0f0f0f] text-white px-1.5 py-0.5 rounded-md">TOP</span>
          )}
        </button>
      ))}

      <div className="mt-auto px-4 py-3 border-t border-black/8">
        {scanning ? (
          <div className="flex items-center gap-2 text-[12px] font-semibold text-neutral-500">
            <Loader2 size={12} className="animate-spin" />
            Scanning…
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[12px] font-semibold text-neutral-400">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
            Ready
          </div>
        )}
      </div>
    </aside>
  )
}

// ── Niche card (existing niches from DB) ───────────────────────────────────
function NicheCard({ niche, saved, onSave }: { niche: Niche; saved: boolean; onSave: () => void }) {
  const compColor: Record<string,string> = { low: '#27500A', medium: '#633806', high: '#A32D2D' }
  const compBg:    Record<string,string> = { low: '#EAF3DE', medium: '#FAEEDA', high: '#FCEBEB' }

  return (
    <Link href={`/niche/${niche.id}`} className="block">
      <div className="bg-white border border-black/10 rounded-xl p-4 hover:border-black/20 hover:shadow-sm transition-all cursor-pointer">
        {/* Scores */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2">
            <div className="text-center">
              <p className="text-[9px] font-black text-[#D85A30] uppercase tracking-wider">Signal</p>
              <p className="text-[18px] font-black text-[#D85A30] leading-none">{niche.signal_score}</p>
            </div>
            <div className="text-center pl-2 border-l border-black/8">
              <p className="text-[9px] font-black text-[#534AB7] uppercase tracking-wider">Fit</p>
              <p className="text-[18px] font-black text-[#534AB7] leading-none">{niche.fit_score}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
              {niche.category}
            </span>
            <button
              onClick={e => { e.preventDefault(); onSave() }}
              className={clsx('p-1 rounded-md transition-colors',
                saved ? 'text-[#534AB7]' : 'text-neutral-400 hover:text-neutral-700'
              )}
            >
              {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            </button>
          </div>
        </div>

        <h3 className="text-[14px] font-black text-[#0f0f0f] mb-1.5 leading-snug">{niche.name}</h3>
        <p className="text-[12px] font-semibold text-neutral-500 leading-relaxed mb-3 line-clamp-2">{niche.why_summary}</p>

        <div className="flex gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
            {niche.mvp_weeks}w MVP
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-md"
            style={{ color: compColor[niche.competition], background: compBg[niche.competition] }}
          >
            {niche.competition} competition
          </span>
          {niche.tags?.slice(0,2).map(tag => (
            <span key={tag} className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function HomePage() {
  const [lang, setLang]       = useState<Lang>('en')
  const [category, setCategory] = useState('all')
  const [sort, setSort]       = useState('signal_score')
  const [scanning, setScanning] = useState(false)
  const [showScan, setShowScan] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [modalItem, setModalItem] = useState<{ item: any; src: typeof SOURCES[number] } | null>(null)
  const [searchQ, setSearchQ] = useState('')

  // Real niches from DB
  const { data: niches = [], isLoading, mutate } = useSWR<Niche[]>(
    `${API}/api/niches/?sort=${sort}${category !== 'all' ? `&category=${category}` : ''}`,
    fetcher, { refreshInterval: scanning ? 3000 : 0 }
  )

  const nicheCounts: Record<string, number> = {
    all: niches.length,
    ai: niches.filter(n => n.category === 'AI & SaaS').length,
    health: niches.filter(n => n.category === 'Health tech').length,
    b2b: niches.filter(n => n.category === 'B2B tools').length,
    dev: niches.filter(n => n.category === 'Dev tools').length,
    creator: niches.filter(n => n.category === 'Creator').length,
  }

  const startScan = async (queries: string[]) => {
    setScanning(true)
    try {
      const profile = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('nicheagent_profile') || '{}')
        : {}
      await fetch(`${API}/api/niches/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queries,
          sources: ['reddit', 'twitter', 'appstore'],
          language: lang,
          user_profile: profile,
        }),
      })
    } catch (e) {
      console.error('Scan error', e)
    }
    setTimeout(() => { setScanning(false); mutate() }, 8000)
  }

  const toggleSave = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSavedIds(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filteredNiches = niches.filter(n =>
    !searchQ || n.name.toLowerCase().includes(searchQ.toLowerCase())
  )

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }} className="min-h-screen bg-[#F2F0EB]">
      <Topbar lang={lang} setLang={setLang} scanning={scanning} />

      <div className="flex h-[calc(100vh-52px)]">
        <Sidebar
          category={category}
          setCategory={setCategory}
          sort={sort}
          setSort={setSort}
          nicheCounts={nicheCounts}
          scanning={scanning}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-5">

            {/* Search + scan bar */}
            <div className="bg-white border border-black/10 rounded-xl px-4 py-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-[#0f0f0f] rounded-[5px] flex items-center justify-center flex-shrink-0">
                  <Zap size={12} className="text-white" />
                </div>
                <h1 className="text-[15px] font-black text-[#0f0f0f]">Discover startup opportunities</h1>
              </div>
              <p className="text-[12px] font-semibold text-neutral-500 mb-3">
                Search existing or trigger a new AI-powered market scan
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    placeholder="Search niches, topics, keywords…"
                    className="input pl-9 text-[13px] w-full"
                  />
                </div>
                <button
                  onClick={() => setShowScan(true)}
                  className="btn-primary text-[13px] gap-2 flex-shrink-0"
                >
                  <RefreshCw size={13} />
                  New scan
                </button>
              </div>
            </div>

            {/* Source sliders */}
            {SOURCES.map(src => (
              <SignalSlider
                key={src.id}
                src={src}
                items={DEMO_SIGNALS[src.id]}
                onCardOpen={(item, s) => setModalItem({ item, src: s })}
                savedIds={savedIds}
                onSave={toggleSave}
                onSeeAll={(srcId) => {
                  // TODO: navigate to /sources/[srcId]
                  console.log('See all', srcId)
                }}
              />
            ))}

            {/* Existing niches from DB */}
            {niches.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[14px] font-black text-[#0f0f0f]">Top opportunities</p>
                  <p className="text-[12px] font-semibold text-neutral-400">
                    {filteredNiches.length} found · by {sort.replace('_', ' ')} · Updated live
                  </p>
                </div>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={20} className="animate-spin text-neutral-400" />
                  </div>
                ) : filteredNiches.length === 0 ? (
                  <div className="bg-white border border-black/10 rounded-xl px-5 py-10 text-center">
                    <p className="text-[15px] font-black text-neutral-700 mb-1">No niches found yet</p>
                    <p className="text-[13px] font-semibold text-neutral-500 mb-5">
                      Trigger a scan to discover opportunities from Reddit, Google Trends, App Store, and more.
                    </p>
                    <button
                      onClick={() => setShowScan(true)}
                      className="btn-primary text-[13px]"
                    >
                      Start first scan
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredNiches.map(niche => (
                      <NicheCard
                        key={niche.id}
                        niche={niche}
                        saved={savedIds.has(niche.id)}
                        onSave={() => toggleSave(niche.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Modals */}
      {showScan && <ScanModal onClose={() => setShowScan(false)} onStart={startScan} />}
      {modalItem && (
        <DetailModal
          item={modalItem.item}
          src={modalItem.src}
          onClose={() => setModalItem(null)}
        />
      )}
    </div>
  )
}
