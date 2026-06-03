'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Radio, Globe, Bookmark, ArrowRight } from 'lucide-react'
import { translations, Lang } from '@/lib/i18n'

export default function SavedPage() {
  const [lang, setLang] = useState<Lang>('en')
  const t = translations[lang]

  return (
    <div style={{ fontFamily: "'Poppins', system-ui, sans-serif" }} className="min-h-screen bg-[#F2F0EB]">
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
          <button onClick={() => setLang(l => l === 'en' ? 'ua' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/15 text-[12px] font-bold text-neutral-700 hover:bg-neutral-50 transition-colors">
            <Globe size={13} />{lang === 'en' ? 'UA' : 'EN'}
          </button>
          <div className="w-8 h-8 rounded-full bg-[#EEEDFE] flex items-center justify-center text-[12px] font-black text-[#534AB7]">ZL</div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8">
        <h1 className="text-[22px] font-black text-[#0f0f0f] mb-1">
          {lang === 'en' ? 'Saved niches' : 'Збережені ніші'}
        </h1>
        <p className="text-[14px] font-semibold text-neutral-500 mb-6">
          {lang === 'en' ? 'Niches you bookmarked — sorted by category.' : 'Ніші які ви відмітили — за категорією.'}
        </p>
        <div className="bg-white rounded-xl border border-black/10 px-6 py-12 text-center">
          <Bookmark size={32} className="text-neutral-300 mx-auto mb-3" />
          <p className="text-[16px] font-black text-neutral-700 mb-1">
            {lang === 'en' ? 'No saved niches yet' : 'Збережених ніш ще немає'}
          </p>
          <p className="text-[13px] font-semibold text-neutral-500 mb-5">
            {lang === 'en'
              ? 'Click the bookmark icon on any niche to save it here.'
              : 'Натисніть іконку закладки на будь-якій ніші щоб зберегти її тут.'}
          </p>
          <Link href="/"
            className="inline-flex items-center gap-2 bg-[#0f0f0f] text-white px-5 py-2.5 rounded-xl text-[13px] font-black hover:bg-neutral-800 transition-colors">
            {lang === 'en' ? 'Browse niches' : 'Переглянути ніші'}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
