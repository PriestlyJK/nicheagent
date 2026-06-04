'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Radio, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const STEPS = [
  {
    id: 'experience',
    title: "What's your founder experience?",
    type: 'single',
    options: [
      { value: 'first-time', label: 'First timer', sub: 'Never launched a product' },
      { value: 'intermediate', label: 'Shipped before', sub: '1–2 side projects' },
      { value: 'experienced', label: 'Serial founder', sub: '3+ products launched' },
    ],
  },
  {
    id: 'team',
    title: "Who's building this?",
    type: 'single',
    options: [
      { value: 'solo', label: 'Solo founder', sub: 'Just me' },
      { value: 'two', label: 'Small team', sub: '2–3 co-founders' },
      { value: 'small', label: 'Real team', sub: '4+ people' },
    ],
  },
  {
    id: 'budget',
    title: 'Initial budget?',
    type: 'single',
    options: [
      { value: 'bootstrap', label: 'Ramen mode', sub: 'Under $500' },
      { value: 'small', label: 'Side hustle budget', sub: '$500–$5k' },
      { value: 'funded', label: 'Serious bet', sub: '$5k–$50k' },
      { value: 'well_funded', label: 'Fully funded', sub: '$50k+' },
    ],
  },
  {
    id: 'skills',
    title: 'Your strongest skills?',
    type: 'multi',
    options: [
      { value: 'coding', label: 'Dev' },
      { value: 'design', label: 'Design' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'sales', label: 'Sales' },
      { value: 'ai-ml', label: 'AI/ML' },
      { value: 'content', label: 'Content' },
      { value: 'finance', label: 'Finance' },
      { value: 'domain', label: 'Domain expert' },
    ],
  },
  {
    id: 'categories',
    title: 'Which spaces excite you?',
    type: 'multi',
    options: [
      { value: 'AI & SaaS', label: 'AI & SaaS' },
      { value: 'Health tech', label: 'Health tech' },
      { value: 'B2B tools', label: 'B2B tools' },
      { value: 'Dev tools', label: 'Dev tools' },
      { value: 'Creator', label: 'Creator economy' },
      { value: 'Other', label: 'Surprise me' },
    ],
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Record<string, any>>({
    skills: [], categories: [],
  })

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const select = (val: string) => {
    if (current.type === 'multi') {
      const arr = data[current.id] || []
      setData({ ...data, [current.id]: arr.includes(val) ? arr.filter((x: string) => x !== val) : [...arr, val] })
    } else {
      setData({ ...data, [current.id]: val })
    }
  }

  const isSelected = (val: string) => {
    const v = data[current.id]
    return Array.isArray(v) ? v.includes(val) : v === val
  }

  const canNext = () => {
    const v = data[current.id]
    return Array.isArray(v) ? v.length > 0 : !!v
  }

  const next = () => {
    if (isLast) {
      localStorage.setItem('nicheagent_profile', JSON.stringify(data))
      localStorage.setItem('nicheagent_onboarded', 'true')
      router.push('/')
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
      className="min-h-screen bg-[#F2F0EB] flex items-center justify-center px-4">
      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-[28px] h-[28px] bg-[#0f0f0f] rounded-[7px] flex items-center justify-center">
            <Radio size={14} className="text-white" />
          </div>
          <span className="text-[16px] font-black text-[#0f0f0f]">NicheAgent</span>
        </div>

        <div className="bg-white border border-black/10 rounded-2xl px-6 py-8">
          {/* Progress */}
          <div className="flex gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <div key={i} className={clsx('h-1 rounded-full flex-1 transition-all',
                i <= step ? 'bg-[#0f0f0f]' : 'bg-neutral-200')} />
            ))}
          </div>

          <p className="text-[11px] font-black text-neutral-400 uppercase tracking-wider mb-2">
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 className="text-[20px] font-black text-[#0f0f0f] mb-5 leading-snug">
            {current.title}
          </h2>

          {current.type === 'multi' && (
            <p className="text-[12px] font-semibold text-neutral-400 mb-3">Select all that apply</p>
          )}

          <div className={clsx('gap-2', current.type === 'multi' ? 'flex flex-wrap' : 'flex flex-col')}>
            {current.options.map(opt => (
              <button key={opt.value} onClick={() => select(opt.value)}
                className={clsx(
                  'border rounded-xl transition-all text-left',
                  current.type === 'multi' ? 'px-3 py-2 text-[13px] font-bold' : 'px-4 py-3',
                  isSelected(opt.value)
                    ? 'bg-[#0f0f0f] text-white border-[#0f0f0f]'
                    : 'border-black/12 text-neutral-700 hover:border-black/25 bg-white'
                )}>
                <span className="font-bold text-[14px]">{opt.label}</span>
                {'sub' in opt && opt.sub && (
                  <p className={clsx('text-[12px] mt-0.5', isSelected(opt.value) ? 'text-white/60' : 'text-neutral-400')}>
                    {opt.sub}
                  </p>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-black/8">
            <button onClick={() => router.push('/')}
              className="text-[13px] font-semibold text-neutral-400 hover:text-neutral-700 transition-colors">
              Skip for now
            </button>
            <button onClick={next} disabled={!canNext()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0f0f0f] text-white rounded-xl
                         text-[13px] font-black hover:bg-neutral-800 transition-colors
                         disabled:opacity-30 disabled:cursor-not-allowed">
              {isLast ? 'Find my niches' : 'Next'}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
