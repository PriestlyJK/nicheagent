import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NicheAgent — Market Intelligence',
  description: 'AI-powered startup niche discovery. Real signals, real opportunities.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-soft">{children}</body>
    </html>
  )
}
