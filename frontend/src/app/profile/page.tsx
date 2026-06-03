'use client'
import { useState } from 'react'
import Topbar from '@/components/ui/Topbar'
import clsx from 'clsx'

const EXPERTISE_OPTIONS = ['AI/ML', 'SaaS', 'Marketing', 'Design', 'Sales', 'Finance', 'Legal', 'Health', 'Dev']
const LOOKING_FOR_OPTIONS = ['Co-founder', 'Investor', 'Developer', 'Designer', 'Advisor']

export default function ProfilePage() {
  const [expertise, setExpertise] = useState<string[]>([])
  const [looking,   setLooking]   = useState<string[]>([])
  const [budget,    setBudget]    = useState('')
  const [bio,       setBio]       = useState('')
  const [saved,     setSaved]     = useState(false)

  const toggle = (arr: string[], set: (v: string[]) => void, val: string) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])

  return (
    <>
      <Topbar />
      <main className="max-w-xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-medium tracking-tight mb-1">Your profile</h1>
        <p className="text-sm text-text-secondary mb-6">
          Your profile helps match you with other builders interested in the same niches.
        </p>

        <div className="space-y-5">
          {/* Expertise */}
          <div className="card px-4 py-4">
            <p className="text-sm font-medium mb-3">Your expertise</p>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_OPTIONS.map(e => (
                <button
                  key={e}
                  onClick={() => toggle(expertise, setExpertise, e)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm border transition-all',
                    expertise.includes(e)
                      ? 'bg-ink text-white border-ink'
                      : 'border-surface-border bg-white text-text-secondary hover:border-black/20'
                  )}
                >{e}</button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="card px-4 py-4">
            <p className="text-sm font-medium mb-3">Launch budget</p>
            <div className="flex gap-2">
              {['bootstrap', 'small', 'funded', 'well_funded'].map(b => (
                <button
                  key={b}
                  onClick={() => setBudget(b)}
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-xs font-medium border transition-all capitalize',
                    budget === b
                      ? 'bg-ink text-white border-ink'
                      : 'border-surface-border bg-white text-text-secondary hover:border-black/20'
                  )}
                >{b.replace('_', ' ')}</button>
              ))}
            </div>
          </div>

          {/* Looking for */}
          <div className="card px-4 py-4">
            <p className="text-sm font-medium mb-3">Looking for</p>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map(l => (
                <button
                  key={l}
                  onClick={() => toggle(looking, setLooking, l)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm border transition-all',
                    looking.includes(l)
                      ? 'bg-ink text-white border-ink'
                      : 'border-surface-border bg-white text-text-secondary hover:border-black/20'
                  )}
                >{l}</button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="card px-4 py-4">
            <p className="text-sm font-medium mb-2">Short bio</p>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="What are you building? What's your background?"
              rows={3}
              className="input resize-none"
            />
          </div>

          <button
            onClick={() => setSaved(true)}
            className="w-full py-2.5 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink-soft transition-colors"
          >
            {saved ? '✓ Saved' : 'Save profile'}
          </button>
        </div>
      </main>
    </>
  )
}
