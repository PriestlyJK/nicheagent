'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { ArrowRight, ArrowLeft, Zap, Users, DollarSign, Shield } from 'lucide-react'

const STEPS = [
  {
    id: 'budget',
    question: 'What is your budget to launch?',
    sub: 'We use this to rank niches by capital requirements and suggest fitting tools.',
    options: [
      { value: 'bootstrap', label: 'Bootstrapped', desc: 'Under $500', icon: '🥾' },
      { value: 'small',     label: 'Small budget', desc: '$500 – $5k',  icon: '💳' },
      { value: 'funded',    label: 'Funded',       desc: '$5k – $50k', icon: '🏦' },
      { value: 'well',      label: 'Well funded',  desc: '$50k+',      icon: '🚀' },
    ],
  },
  {
    id: 'time',
    question: 'How fast do you want to ship MVP?',
    sub: 'Sets the time-to-MVP filter. Faster = simpler niches with proven playbooks.',
    options: [
      { value: 'asap',     label: 'ASAP',      desc: '1 – 2 weeks',  icon: '⚡' },
      { value: 'moderate', label: 'Moderate',  desc: '2 – 4 weeks',  icon: '📅' },
      { value: 'patient',  label: 'Patient',   desc: '1 – 3 months', icon: '🕐' },
      { value: 'longterm', label: 'Long term', desc: '3 – 6 months', icon: '🗓' },
    ],
  },
  {
    id: 'team',
    question: 'Who is building this?',
    sub: 'Solo founders vs teams have different operational fit scores.',
    options: [
      { value: 'solo',       label: 'Solo',       desc: 'Just me',       icon: '🙋' },
      { value: 'small_team', label: 'Small team', desc: '2 – 3 people',  icon: '👥' },
      { value: 'startup',    label: 'Startup',    desc: '4 – 10 people', icon: '🏢' },
      { value: 'agency',     label: 'Agency',     desc: 'Existing team', icon: '💼' },
    ],
  },
  {
    id: 'risk',
    question: 'What is your risk appetite?',
    sub: 'Affects competitive intensity weighting. Higher risk = more emerging niches.',
    options: [
      { value: 'safe',       label: 'Safe',       desc: 'Proven markets',  icon: '🛡' },
      { value: 'balanced',   label: 'Balanced',   desc: 'Mix of both',     icon: '⚖️' },
      { value: 'aggressive', label: 'Aggressive', desc: 'Emerging niches', icon: '🔥' },
      { value: 'yolo',       label: 'YOLO',       desc: 'Wildcard bets',   icon: '🎲' },
    ],
  },
]

interface WizardProps {
  onComplete: (answers: Record<string, string>) => void
  onSkip: () => void
}

export default function Wizard({ onComplete, onSkip }: WizardProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const current = STEPS[step]
  const selected = answers[current.id]
  const pct = Math.round(((step + (selected ? 1 : 0)) / STEPS.length) * 100)

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else onComplete(answers)
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {step + 1} of {STEPS.length}</span>
            <button onClick={onSkip} className="text-sm text-text-tertiary hover:text-text-secondary transition-colors">
              Skip setup
            </button>
          </div>
          <div className="h-1 bg-surface-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-ink rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <h1 className="text-2xl font-medium tracking-tight mb-1.5">{current.question}</h1>
        <p className="text-sm text-text-secondary mb-6 leading-relaxed">{current.sub}</p>

        {/* Options */}
        <div className="grid grid-cols-2 gap-2.5 mb-8">
          {current.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => setAnswers(a => ({ ...a, [current.id]: opt.value }))}
              className={clsx(
                'text-left p-4 rounded-xl border-2 transition-all',
                selected === opt.value
                  ? 'border-ink bg-ink text-white'
                  : 'border-surface-border bg-white hover:border-black/20 hover:bg-surface-soft'
              )}
            >
              <div className="text-xl mb-2">{opt.icon}</div>
              <p className="text-sm font-medium mb-0.5">{opt.label}</p>
              <p className={clsx('text-xs', selected === opt.value ? 'text-white/70' : 'text-text-tertiary')}>
                {opt.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="btn px-4 py-2">
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <button
            onClick={next}
            disabled={!selected}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all',
              selected
                ? 'bg-ink text-white hover:bg-ink-soft'
                : 'bg-surface-muted text-text-tertiary cursor-not-allowed'
            )}
          >
            {step === STEPS.length - 1 ? 'Find opportunities' : 'Continue'}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
