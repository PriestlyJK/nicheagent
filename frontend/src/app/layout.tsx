import type { Metadata } from 'next'
import './globals.css'
import { Poppins } from 'next/font/google'
const poppins = Poppins({ subsets: ['latin'], weight: ['400','500','600','700','800','900'], variable: '--font-poppins' })

export const metadata: Metadata = {
  title: 'NicheAgent — Market Intelligence',
  description: 'AI-powered startup niche discovery. Real signals, real opportunities.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body style={{fontFamily: "Poppins, system-ui, sans-serif"}} className="min-h-screen bg-surface-soft">{children}</body>
    </html>
  )
}
