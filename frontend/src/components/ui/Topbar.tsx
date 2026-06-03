'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Radio, Bookmark, Database, Users } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { href: '/',        label: 'Discover' },
  { href: '/saved',   label: 'Saved' },
  { href: '/sources', label: 'Sources' },
  { href: '/profile', label: 'Community' },
]

interface TopbarProps {
  scanning?: boolean
  sourcesCount?: number
}

export default function Topbar({ scanning, sourcesCount }: TopbarProps) {
  const path = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-surface-border">
      <div className="flex items-center h-[52px] px-5 gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mr-2">
          <div className="w-[26px] h-[26px] bg-ink rounded-[7px] flex items-center justify-center">
            <Radio size={14} className="text-white" />
          </div>
          <span className="text-lg font-medium tracking-tight">NicheAgent</span>
        </div>

        {/* Nav */}
        <nav className="flex gap-0.5">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-lg transition-colors duration-150',
                path === href
                  ? 'bg-surface-muted text-text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="ml-auto flex items-center gap-2.5">
          {/* Scan status */}
          <div className={clsx(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all',
            scanning
              ? 'border-accent-teal/30 bg-accent-teal-light text-accent-teal-dark'
              : 'border-surface-border bg-surface-soft text-text-tertiary'
          )}>
            <span className={clsx(
              'w-1.5 h-1.5 rounded-full',
              scanning ? 'bg-accent-teal scan-pulse' : 'bg-surface-border'
            )} />
            {scanning ? 'Scanning' : `${sourcesCount ?? 5} sources`}
          </div>

          {/* Avatar placeholder */}
          <div className="w-7 h-7 rounded-full bg-accent-purple-light flex items-center justify-center text-2xs font-medium text-accent-purple">
            ZL
          </div>
        </div>
      </div>
    </header>
  )
}
