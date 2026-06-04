'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import { Radio, Globe, ArrowLeft, Check, Loader2 } from 'lucide-react'
import { translations, Lang } from '@/lib/i18n'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const EXPERTISE_OPTIONS = ['AI/ML', 'SaaS', 'Marketing', 'Design', 'Sales', 'Finance', 'Legal', 'Health', 'Dev']
const LOOKING_FOR_OPTIONS = ['Co-founder', 'Investor', 'Developer', 'Designer', 'Advisor']
const CATEGORY_OPTIONS = ['AI & SaaS', 'Health tech', 'B2B tools', 'Dev tools', 'Creator', 'Other']

export default function ProfilePage() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('en')
  const t = translations[lang]

  const [expertise, setExpertise] = useState<string[]>([])
  const [looking,   setLooking]   = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [budget,    setBudget]    = useState('')
  const [team,      setTeam]      = useState('')
  const [bio,       setBio]       = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('nicheagent_profile')
    if (stored) {
      try {
        const p = JSON.parse(stored)
        setExpertise(p.expertise || [])
        setLooking(p.looking || [])
        setCategories(p.categories || [])
        setBudget(p.budget || '')
        setTeam(p.team || '')
        setBio(p.bio || '')
      } catch {}
    }
  }, [])

  const toggle = (arr: string[], set: (v: string[]) => void, val: string) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])

  const handleSave = async () => {
    setSaving(true)
    const profile = { expertise, looking, categories, budget, team, bio }
    localStorage.setItem('nicheagent_profile', JSON.stringify(profile))
    try {
      await fetch(`${API}/api/niches/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'user_' + Date.now(), ...profile }),
      })
    } catch {}
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ fontFamily: "'Poppins', system-ui, sans-serif" }} className="min-h-screen bg-[#F2F0EB]">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-black/10 h-[52px] flex items-center px-5 gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-[27px] h-[27px] bg-[#0f0f0f] rounded-[7px] flex items-center justify-center">
            <Radio size={14} className="text-white" />
          </div>
          <span className="text-[16px] font-black tracking-tight text-[#0f0f0f]">NicheAgent</span>
        </div>
        <nav className="flex gap-0.5 ml-2">
          <Link href="/" className="px-3 py-1.5 text-[13px] font-semibold rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
            Discover
          </Link>
          <Link href="/saved" className="px-3 py-1.5 text-[13px] font-semibold rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
            Saved
          </Link>
          <Link href="/profile" className="px-3 py-1.5 text-[13px] font-black rounded-lg text-[#0f0f0f] bg-neutral-100 transition-colors">
            My profile
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <button onClick={() => setLang(l => l === 'en' ? 'ua' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-black/12 text-[12px] font-bold text-neutral-700 hover:bg-neutral-50 transition-colors">
            <Globe size={13} />{lang === 'en' ? 'UA' : 'EN'}
          </button>
          <div className="w-8 h-8 rounded-full bg-[#EEEDFE] flex items-center justify-center text-[12px] font-black text-[#534AB7]">ZL</div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 py-8">
        <h1 className="text-[22px] font-black text-[#0f0f0f] mb-1">My profile</h1>
        <p className="text-[13px] font-semibold text-neutral-500 mb-6">
          Your profile personalizes niche recommendations and scan results.
        </p>

        <div className="space-y-4">
          {/* Expertise */}
          <div className="bg-white border border-black/10 rounded-xl px-4 py-4">
            <p className="text-[13px] font-black text-[#0f0f0f] mb-3">Your expertise</p>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_OPTIONS.map(e => (
                <button key={e} onClick={() => toggle(expertise, setExpertise, e)}
                  className={clsx('px-3 py-1.5 rounded-lg text-[13px] font-semibold border transition-all',
                    expertise.includes(e)
                      ? 'bg-[#0f0f0f] text-white border-[#0f0f0f]'
                      : 'border-black/12 bg-white text-neutral-600 hover:border-black/25'
                  )}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="bg-white border border-black/10 rounded-xl px-4 py-4">
            <p className="text-[13px] font-black text-[#0f0f0f] mb-3">Launch budget</p>
            <div className="flex gap-2">
              {[['bootstrap','Bootstrap'],['small','$1–5k'],['funded','$5k+'],['well_funded','$50k+']].map(([val,label]) => (
                <button key={val} onClick={() => setBudget(val)}
                  className={clsx('flex-1 py-2 rounded-lg text-[12px] font-bold border transition-all',
                    budget === val
                      ? 'bg-[#0f0f0f] text-white border-[#0f0f0f]'
                      : 'border-black/12 bg-white text-neutral-600 hover:border-black/25'
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Team */}
          <div className="bg-white border border-black/10 rounded-xl px-4 py-4">
            <p className="text-[13px] font-black text-[#0f0f0f] mb-3">Team size</p>
            <div className="flex gap-2">
              {[['solo','Solo'],['two','2 people'],['small','3–5']].map(([val,label]) => (
                <button key={val} onClick={() => setTeam(val)}
                  className={clsx('flex-1 py-2 rounded-lg text-[12px] font-bold border transition-all',
                    team === val
                      ? 'bg-[#0f0f0f] text-white border-[#0f0f0f]'
                      : 'border-black/12 bg-white text-neutral-600 hover:border-black/25'
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white border border-black/10 rounded-xl px-4 py-4">
            <p className="text-[13px] font-black text-[#0f0f0f] mb-3">Interested in</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map(c => (
                <button key={c} onClick={() => toggle(categories, setCategories, c)}
                  className={clsx('px-3 py-1.5 rounded-lg text-[13px] font-semibold border transition-all',
                    categories.includes(c)
                      ? 'bg-[#EEEDFE] text-[#3C3489] border-[#AFA9EC]'
                      : 'border-black/12 bg-white text-neutral-600 hover:border-black/25'
                  )}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Looking for */}
          <div className="bg-white border border-black/10 rounded-xl px-4 py-4">
            <p className="text-[13px] font-black text-[#0f0f0f] mb-3">Looking for</p>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map(l => (
                <button key={l} onClick={() => toggle(looking, setLooking, l)}
                  className={clsx('px-3 py-1.5 rounded-lg text-[13px] font-semibold border transition-all',
                    looking.includes(l)
                      ? 'bg-[#0f0f0f] text-white border-[#0f0f0f]'
                      : 'border-black/12 bg-white text-neutral-600 hover:border-black/25'
                  )}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="bg-white border border-black/10 rounded-xl px-4 py-4">
            <p className="text-[13px] font-black text-[#0f0f0f] mb-2">Short bio</p>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="What are you building? What's your background?"
              rows={3}
              className="w-full px-3 py-2 text-[13px] bg-white border border-black/10 rounded-lg placeholder-neutral-400 text-[#0f0f0f] focus:outline-none focus:ring-1 focus:ring-[#0f0f0f] focus:border-[#0f0f0f] transition-colors resize-none"
            />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 bg-[#0f0f0f] text-white rounded-xl text-[14px] font-black hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <><Loader2 size={15} className="animate-spin"/> Saving…</> :
             saved  ? <><Check size={15}/> Saved!</> : 'Save profile'}
          </button>
        </div>
      </main>
    </div>
  )
}
