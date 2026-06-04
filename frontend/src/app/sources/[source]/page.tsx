'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import {
  ArrowLeft, ExternalLink, Bookmark, BookmarkCheck,
  Star, ChevronRight, Search, SlidersHorizontal, X, Radio, Globe,
} from 'lucide-react'
import { translations, Lang } from '@/lib/i18n'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Same source config and demo data as page.tsx
// In production this comes from useSWR(`${API}/api/signals?source=${source}`)

const SOURCES_META: Record<string, {
  label: string; favicon: string; accentBg: string; accentText: string; accentBorder: string
}> = {
  reddit: {
    label: 'Reddit', favicon: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=32',
    accentBg: '#FCEBEB', accentText: '#A32D2D', accentBorder: '#F09595',
  },
  appstore: {
    label: 'App Store', favicon: 'https://www.google.com/s2/favicons?domain=apple.com&sz=32',
    accentBg: '#E6F1FB', accentText: '#0C447C', accentBorder: '#85B7EB',
  },
  twitter: {
    label: 'X / Twitter', favicon: 'https://www.google.com/s2/favicons?domain=twitter.com&sz=32',
    accentBg: '#EAF3DE', accentText: '#27500A', accentBorder: '#97C459',
  },
  trends: {
    label: 'Google Trends', favicon: 'https://www.google.com/s2/favicons?domain=trends.google.com&sz=32',
    accentBg: '#FAEEDA', accentText: '#633806', accentBorder: '#EF9F27',
  },
}

const DEMO_ALL: Record<string, any[]> = {
  reddit: [
    { id: 'r1', sub: 'r/indiehackers', author: 'u/indie_maker_92', score: 847, comments: 134, source_url: 'https://www.reddit.com/r/indiehackers/', title: 'I spend 3 hours every Monday pulling metrics from 6 tools into a spreadsheet', quote: 'I spend 3 hours every Monday manually pulling metrics from 6 different tools into a Google Sheet. There has to be a better way.', idea: 'Lightweight metrics aggregator for solopreneurs — auto-pull KPIs from Stripe, GA4, Notion into one shareable dashboard', budget: '$8k–15k', mvp: '8w', competition: 'medium', signal: 88, tags: ['dashboard', 'metrics', 'solo'] },
    { id: 'r2', sub: 'r/SaaS', author: 'u/saas_builder', score: 612, comments: 89, source_url: 'https://www.reddit.com/r/SaaS/', title: 'Why is every B2B cold email tool designed for teams of 20+?', quote: 'I\'m solo, I just need something that actually delivers and doesn\'t have 400 features I\'ll never use.', idea: 'Solo-founder cold outreach tool — deliverability-first, dead simple, $29/mo flat', budget: '$5k–10k', mvp: '6w', competition: 'high', signal: 82, tags: ['email', 'outreach', 'b2b'] },
    { id: 'r3', sub: 'r/nocode', author: 'u/no_code_nina', score: 1203, comments: 201, source_url: 'https://www.reddit.com/r/nocode/', title: 'Zapier breaks silently and I don\'t know until the client complains 3 days later', quote: 'Every time I try to automate my client onboarding it breaks silently.', idea: 'Silent failure detector for no-code automations — monitors Zapier/Make flows and alerts on breakage', budget: '$3k–6k', mvp: '5w', competition: 'low', signal: 91, tags: ['automation', 'nocode', 'monitoring'] },
    { id: 'r4', sub: 'r/microsaas', author: 'u/bootstrapped_dev', score: 489, comments: 67, source_url: 'https://www.reddit.com/r/microsaas/', title: 'No tool shows me WHERE my exact customer hangs out online', quote: 'I\'ve validated 3 SaaS ideas but always get stuck at "who do I actually target first?" There\'s no tool that shows me WHERE my exact customer hangs out online.', idea: 'ICP locator — AI finds the subreddits, Slack groups, newsletters where your exact customer spends time', budget: '$6k–12k', mvp: '7w', competition: 'low', signal: 85, tags: ['icp', 'targeting', 'research'] },
    { id: 'r5', sub: 'r/freelance', author: 'u/freelance_ops', score: 378, comments: 44, source_url: 'https://www.reddit.com/r/freelance/', title: 'Client invoicing is the worst part of my week', quote: 'Chasing payments, writing follow-up emails, manually calculating late fees.', idea: 'Freelancer invoice autopilot — sends, follows up, calculates late fees, accepts cards automatically', budget: '$4k–8k', mvp: '6w', competition: 'medium', signal: 79, tags: ['invoicing', 'freelance', 'payments'] },
    { id: 'r6', sub: 'r/Entrepreneur', author: 'u/growth_hacker', score: 291, comments: 33, source_url: 'https://www.reddit.com/r/Entrepreneur/', title: 'Product Hunt launches are a black box — why do some get 800 upvotes and mine got 40?', quote: 'Product Hunt launches are a black box. I have no idea why some products get 800 upvotes and mine got 40.', idea: 'PH launch analyzer — audit your product page, timing, tagline vs top launchers', budget: '$2k–5k', mvp: '4w', competition: 'low', signal: 76, tags: ['producthunt', 'launch', 'marketing'] },
    { id: 'r7', sub: 'r/webdev', author: 'u/dev_maker', score: 521, comments: 88, source_url: 'https://www.reddit.com/r/webdev/', title: 'Spent 4 hours debugging why my Next.js deploy failed — turned out it was a missing env var', quote: 'Spent 4 hours debugging why my Next.js deploy failed on Vercel. Turned out it was a missing env var that nobody told me about.', idea: 'Deploy health checker — pre-deployment env var audit, dependency conflicts detector', budget: '$2k–4k', mvp: '3w', competition: 'low', signal: 73, tags: ['devops', 'deploy', 'nextjs'] },
    { id: 'r8', sub: 'r/startups', author: 'u/mvp_builder', score: 634, comments: 112, source_url: 'https://www.reddit.com/r/startups/', title: 'I keep building features nobody asked for — where do I find real customer pain?', quote: 'I keep building features nobody asked for. My last 3 launches all failed. I\'m building in a vacuum.', idea: 'Customer pain aggregator — pulls complaints from Reddit, App Store, Twitter for your category', budget: '$5k–10k', mvp: '6w', competition: 'medium', signal: 80, tags: ['validation', 'research', 'pmf'] },
  ],
  appstore: [
    { id: 'a1', app: 'Notion', stars: 1, author: 'JanekM88', source_url: 'https://apps.apple.com/app/notion/id1232780281', title: 'Can\'t share one page without forcing visitors to log in', quote: 'I just want to share one page publicly without forcing visitors to log in. This "feature" has been requested for 5 years.', idea: 'Public-first wiki for solopreneurs — zero friction sharing, no login wall, SEO-indexed by default', budget: '$10k–20k', mvp: '10w', competition: 'high', signal: 85, tags: ['wiki', 'sharing', 'nocode'] },
    { id: 'a2', app: 'Calendly', stars: 1, author: 'AppUser99', source_url: 'https://apps.apple.com/app/calendly/id1271316900', title: 'Now clients need a Calendly account to book?? Made it HARDER', quote: 'Every client has to create a Calendly account now?? I switched to Calendly to make booking EASIER not to add another signup barrier.', idea: 'Zero-friction booking — book via link, no account needed, payments + reminders included', budget: '$6k–12k', mvp: '7w', competition: 'medium', signal: 80, tags: ['booking', 'scheduling', 'saas'] },
    { id: 'a3', app: 'QuickBooks', stars: 1, author: 'SmallBizOps', source_url: 'https://apps.apple.com/app/quickbooks/id584606479', title: 'Designed for accountants, not founders. Just show me: am I profitable?', quote: 'QuickBooks is designed for an accountant, not a founder. I spend more time figuring out the interface than actually doing my books.', idea: 'Founder-first P&L — one screen, one answer: profitable or not, what to cut, what to grow', budget: '$8k–18k', mvp: '9w', competition: 'high', signal: 88, tags: ['finance', 'accounting', 'founder'] },
    { id: 'a4', app: 'Later', stars: 2, author: 'CreatorEco24', source_url: 'https://apps.apple.com/app/later/id784375489', title: '$80/mo and still can\'t cross-post Reels to TikTok without reformatting', quote: '$80/mo and I still can\'t cross-post Reels to TikTok without reformatting everything manually.', idea: 'True cross-format auto-publisher — adapts video format/captions/hashtags per platform', budget: '$12k–25k', mvp: '12w', competition: 'high', signal: 83, tags: ['social', 'video', 'creator'] },
    { id: 'a5', app: 'Lemon Squeezy', stars: 1, author: 'IndieDevMo', source_url: 'https://apps.apple.com/us/app/lemon-squeezy/id6449167789', title: 'EU VAT compliance completely broken — hired a freelancer just to figure it out', quote: 'EU VAT compliance is completely broken. I had to hire a freelancer just to figure out what Lemon Squeezy is supposed to handle automatically.', idea: 'EU VAT autopilot for digital products — zero setup, handles OSS, automatic compliance', budget: '$15k–30k', mvp: '14w', competition: 'low', signal: 92, tags: ['vat', 'compliance', 'europe'] },
    { id: 'a6', app: 'HoneyBook', stars: 2, author: 'FreelancerKL', source_url: 'https://apps.apple.com/app/honeybook/id981457103', title: 'Client portal looks like it was designed in 2015 — my clients are embarrassed', quote: 'Client portal looks like it was designed in 2015. My clients ask me what CRM this is because it looks so unprofessional.', idea: 'Modern client portal builder — beautiful by default, white-label, $29/mo for freelancers', budget: '$9k–16k', mvp: '8w', competition: 'medium', signal: 77, tags: ['crm', 'portal', 'freelance'] },
  ],
  twitter: [
    { id: 't1', author: '@joannaMakesMRR', source_url: 'https://twitter.com/joannaMakesMRR', title: 'Every AI writing tool produces the same outputs — I can tell which use GPT-4 from the first sentence', quote: 'Why does every AI writing tool produce the exact same outputs? I can tell which ones use GPT-4 from the first sentence.', idea: 'Brand voice AI — trained on YOUR past content, writes in your exact style without prompt engineering', budget: '$8k–15k', mvp: '8w', competition: 'medium', signal: 84, tags: ['ai', 'writing', 'brand'] },
    { id: 't2', author: '@remote_ops_guy', source_url: 'https://twitter.com/remote_ops_guy', title: 'Onboarded 4 contractors, 6 tools, 23 emails — still nobody knows what they\'re doing', quote: 'We onboarded 4 contractors last week. Used 6 different tools. Sent 23 emails. Still no one knows what they\'re supposed to be doing.', idea: 'Contractor onboarding OS — single link, all docs, tasks, and expectations in one place', budget: '$5k–10k', mvp: '6w', competition: 'medium', signal: 79, tags: ['hr', 'onboarding', 'remote'] },
    { id: 't3', author: '@founder_in_EU', source_url: 'https://twitter.com/founder_in_EU', title: 'Launched SaaS in US, got a GDPR complaint on day 3', quote: 'Launched my SaaS in the US. Got a GDPR complaint on day 3. Nobody warns you how brutal European compliance is for a solo founder without a lawyer.', idea: 'GDPR compliance wizard for SaaS startups — self-serve, plain English, country-specific requirements', budget: '$6k–12k', mvp: '7w', competition: 'low', signal: 87, tags: ['gdpr', 'compliance', 'legal'] },
    { id: 't4', author: '@contentrepurpose', source_url: 'https://twitter.com/contentrepurpose', title: '45-min podcast → transcript, clips, LinkedIn, Twitter, email = full-time job', quote: 'I recorded a 45-min podcast. I need: transcript, show notes, clips for TikTok, LinkedIn post, Twitter thread, email newsletter. That\'s a full-time job of editing.', idea: 'Podcast → full content suite in 10 min — auto-clips, captions, social formats, newsletter draft', budget: '$10k–20k', mvp: '10w', competition: 'high', signal: 86, tags: ['podcast', 'content', 'ai'] },
  ],
  trends: [
    { id: 'tr1', sub: 'Breakout +2400%', source_url: 'https://trends.google.com/trends/explore?q=ai+receptionist', title: '"AI receptionist" up +2400% in 90 days', quote: '"AI receptionist" searches up +2400% in 90 days. Small businesses can\'t afford a real receptionist. Searches from dental offices, salons, clinics.', idea: 'AI receptionist for SMBs — answers calls, books appointments, handles FAQs, $49/mo', budget: '$15k–30k', mvp: '12w', competition: 'medium', signal: 94, tags: ['ai', 'smb', 'voice'] },
    { id: 'tr2', sub: 'Breakout +890%', source_url: 'https://trends.google.com/trends/explore?q=llm+cost+tracker', title: '"LLM cost tracker" breakout — developers getting surprise bills', quote: '"LLM cost tracker" breakout. Developers are getting surprise bills from OpenAI. No good tool to forecast or cap costs across providers.', idea: 'LLM cost dashboard — real-time spend tracking, budget alerts, provider comparison by use case', budget: '$4k–8k', mvp: '5w', competition: 'low', signal: 89, tags: ['llm', 'cost', 'developer'] },
    { id: 'tr3', sub: 'Breakout +1800%', source_url: 'https://trends.google.com/trends/explore?q=b2b+whatsapp+crm', title: '"B2B WhatsApp CRM" exploding in LATAM and India', quote: '"B2B WhatsApp CRM" exploding in LATAM and India. Businesses managing clients over WhatsApp with zero tooling.', idea: 'WhatsApp CRM for emerging markets — pipeline in your existing chat, no migration needed', budget: '$12k–25k', mvp: '10w', competition: 'low', signal: 91, tags: ['crm', 'whatsapp', 'latam'] },
    { id: 'tr4', sub: 'Rising +320%', source_url: 'https://trends.google.com/trends/explore?q=micro+saas+ideas', title: '"Micro SaaS ideas" up 320% — people searching for validated niches', quote: 'Searches for "micro SaaS ideas 2025" up 320%. People are actively looking for validated niches to build into.', idea: 'NicheAgent — exactly what the market is searching for', budget: '—', mvp: '—', competition: '—', signal: 96, tags: ['microsaas', 'ideas', 'market'] },
  ],
}

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={10}
          className={i <= count ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'} />
      ))}
    </div>
  )
}

function FullSignalCard({
  item, srcMeta, saved, onSave, onOpen,
}: { item: any; srcMeta: typeof SOURCES_META[string]; saved: boolean; onSave: () => void; onOpen: () => void }) {
  const compColor: Record<string,string> = { low: '#27500A', medium: '#633806', high: '#A32D2D' }
  const compBg:    Record<string,string> = { low: '#EAF3DE', medium: '#FAEEDA', high: '#FCEBEB' }

  return (
    <div
      className="bg-white border border-black/10 rounded-xl p-4 flex flex-col gap-3
                 hover:border-black/20 hover:shadow-sm transition-all cursor-pointer"
      onClick={onOpen}
    >
      {/* Source + signal score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={srcMeta.favicon} alt={srcMeta.label}
               className="w-4 h-4 rounded-sm"
               onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
          <span className="text-[11px] font-bold" style={{ color: srcMeta.accentText }}>
            {item.sub || item.app || item.author}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {item.stars && <StarRow count={item.stars} />}
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md"
                style={{ background: srcMeta.accentBg, color: srcMeta.accentText }}>
            {item.signal}
          </span>
        </div>
      </div>

      {/* Title */}
      <p className="text-[13px] font-black text-[#0f0f0f] leading-snug line-clamp-2">{item.title}</p>

      {/* Quote */}
      <div className="text-[12px] font-semibold leading-relaxed border-l-[3px] pl-2.5 py-1"
           style={{ borderColor: srcMeta.accentBorder, background: srcMeta.accentBg + '44', color: '#3d3d3a' }}>
        "{item.quote.slice(0, 130)}{item.quote.length > 130 ? '…' : ''}"
      </div>

      {/* Source link */}
      <a href={item.source_url} target="_blank" rel="noopener noreferrer"
         className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 hover:text-[#534AB7] transition-colors w-fit"
         onClick={e => e.stopPropagation()}>
        <ExternalLink size={9} />
        View original
      </a>

      {/* Description */}
      <p className="text-[12px] font-semibold text-neutral-600 leading-relaxed line-clamp-2">
        {item.idea}
      </p>

      {/* Metrics */}
      <div className="flex gap-1.5 flex-wrap">
        {item.budget !== '—' && (
          <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">{item.budget}</span>
        )}
        {item.mvp !== '—' && (
          <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">{item.mvp} MVP</span>
        )}
        {item.competition !== '—' && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                style={{ color: compColor[item.competition] || '#888', background: compBg[item.competition] || '#f5f5f3' }}>
            {item.competition}
          </span>
        )}
        {item.tags?.slice(0,2).map((tag: string) => (
          <span key={tag} className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-black/6 mt-auto">
        <button
          className={clsx('flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-all',
            saved ? 'text-[#534AB7] bg-[#EEEDFE]' : 'text-neutral-500 hover:bg-neutral-100'
          )}
          onClick={e => { e.stopPropagation(); onSave() }}
        >
          {saved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
          {saved ? 'Saved' : 'Save'}
        </button>
        <button className="flex items-center gap-1 text-[11px] font-bold text-[#534AB7] hover:text-[#3C3489] transition-colors">
          Full idea <ChevronRight size={11} />
        </button>
      </div>
    </div>
  )
}

export default function SourcePage() {
  const params = useParams<{ source: string }>()
  const router = useRouter()
  const source = params.source as string
  const srcMeta = SOURCES_META[source]

  const [lang, setLang]     = useState<Lang>('en')
  const [savedIds, setSaved] = useState<Set<string>>(new Set())
  const [searchQ, setSearch] = useState('')
  const [sortBy, setSort]   = useState<'signal' | 'score' | 'recent'>('signal')
  const [modal, setModal]   = useState<any | null>(null)

  if (!srcMeta) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F2F0EB]">
        <div className="text-center">
          <p className="text-[16px] font-black text-neutral-900 mb-2">Source not found</p>
          <Link href="/" className="text-[14px] text-[#534AB7] font-bold hover:underline">← Back</Link>
        </div>
      </div>
    )
  }

  const allItems = DEMO_ALL[source] || []

  const filtered = allItems
    .filter(item =>
      !searchQ ||
      item.title?.toLowerCase().includes(searchQ.toLowerCase()) ||
      item.idea?.toLowerCase().includes(searchQ.toLowerCase()) ||
      item.quote?.toLowerCase().includes(searchQ.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'signal') return b.signal - a.signal
      if (sortBy === 'score') return (b.score || 0) - (a.score || 0)
      return 0
    })

  const toggleSave = (id: string) => {
    setSaved(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }} className="min-h-screen bg-[#F2F0EB]">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-black/10 h-[52px] flex items-center px-5 gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-[27px] h-[27px] bg-[#0f0f0f] rounded-[7px] flex items-center justify-center">
            <Radio size={14} className="text-white" />
          </div>
          <span className="text-[16px] font-black tracking-tight text-[#0f0f0f]">NicheAgent</span>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[13px] font-bold text-neutral-600 hover:text-neutral-900 transition-colors ml-2"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div className="ml-auto flex items-center gap-2.5">
          <button onClick={() => setLang(l => l === 'en' ? 'ua' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-black/12
                       text-[12px] font-bold text-neutral-700 hover:bg-neutral-50 transition-colors">
            <Globe size={13} />{lang === 'en' ? 'UA' : 'EN'}
          </button>
          <Link href="/profile"
            className="w-8 h-8 rounded-full bg-[#EEEDFE] flex items-center justify-center
                       text-[12px] font-black text-[#534AB7]">
            ZL
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-5">
          <img src={srcMeta.favicon} alt={srcMeta.label} className="w-8 h-8 rounded-lg"
               onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
          <div>
            <h1 className="text-[22px] font-black text-[#0f0f0f]">{srcMeta.label}</h1>
            <p className="text-[13px] font-semibold text-neutral-500">{filtered.length} pain signals scraped</p>
          </div>
        </div>

        {/* Search + sort bar */}
        <div className="bg-white border border-black/10 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={searchQ} onChange={e => setSearch(e.target.value)}
                   placeholder="Search signals, ideas…"
                   className="input pl-9 text-[13px] w-full" />
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            {[
              { id: 'signal', label: 'Signal' },
              { id: 'score',  label: 'Score' },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => setSort(id as any)}
                className={clsx('px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-all',
                  sortBy === id
                    ? 'bg-[#0f0f0f] text-white border-[#0f0f0f]'
                    : 'border-black/10 text-neutral-600 hover:border-black/20'
                )}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-3 xl:grid-cols-4">
          {filtered.map(item => (
            <FullSignalCard
              key={item.id}
              item={item}
              srcMeta={srcMeta}
              saved={savedIds.has(item.id)}
              onSave={() => toggleSave(item.id)}
              onOpen={() => setModal(item)}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto"
             onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl border border-black/10 w-full max-w-[520px] overflow-hidden"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/8">
              <div className="flex items-center gap-2">
                <img src={srcMeta.favicon} alt={srcMeta.label} className="w-4 h-4 rounded-sm"
                     onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
                <p className="text-[12px] font-bold text-neutral-600">{modal.sub || modal.app || modal.author}</p>
              </div>
              <button onClick={() => setModal(null)}
                className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center
                           text-neutral-500 hover:bg-neutral-200 transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-2">Original signal</p>
                <div className="text-[13px] font-semibold leading-relaxed border-l-[3px] pl-3 py-1"
                     style={{ borderColor: srcMeta.accentBorder, background: srcMeta.accentBg + '55' }}>
                  "{modal.quote}"
                </div>
                <a href={modal.source_url} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-black text-[#534AB7] hover:underline">
                  <ExternalLink size={10} /> View original on {srcMeta.label}
                </a>
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-2">The idea</p>
                <p className="text-[14px] font-black text-[#0f0f0f] leading-snug bg-[#EEEDFE] rounded-xl px-4 py-3">{modal.idea}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[{ label: 'Budget', value: modal.budget }, { label: 'MVP', value: modal.mvp }, { label: 'Signal', value: modal.signal }].map(({ label, value }) => (
                  <div key={label} className="bg-neutral-50 rounded-xl px-3 py-2.5 border border-black/6 text-center">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">{label}</p>
                    <p className="text-[17px] font-black text-[#0f0f0f] mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 bg-[#0f0f0f] text-white rounded-xl text-[13px] font-black
                                   hover:bg-neutral-800 transition-colors">
                  Generate roadmap →
                </button>
                <button onClick={() => setModal(null)}
                  className="px-4 py-2.5 border border-black/12 rounded-xl text-[13px] font-bold text-neutral-700
                             hover:bg-neutral-50 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
