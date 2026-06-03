'use client'
import Topbar from '@/components/ui/Topbar'
import { ExternalLink } from 'lucide-react'

const SOURCES = [
  { name: 'Reddit',        id: 'reddit',        url: 'https://praw.readthedocs.io',         status: 'active', signals: 218, note: 'PRAW API · 100 req/min · free',           color: 'bg-accent-coral-light text-accent-coral-dark' },
  { name: 'Google Trends', id: 'trends',        url: 'https://github.com/GeneralMills/pytrends', status: 'active', signals: 89,  note: 'pytrends · unofficial · free',            color: 'bg-accent-green-light text-accent-green-dark' },
  { name: 'Product Hunt',  id: 'producthunt',   url: 'https://api.producthunt.com/v2/docs', status: 'active', signals: 134, note: 'GraphQL API · free key required',         color: 'bg-accent-purple-light text-accent-purple-dark' },
  { name: 'Meta Ads',      id: 'meta_ads',      url: 'https://facebook.com/ads/library',    status: 'active', signals: 67,  note: 'Public library · no auth required',       color: 'bg-accent-purple-light text-accent-purple-dark' },
  { name: 'App Store',     id: 'appstore',      url: 'https://itunes.apple.com',            status: 'active', signals: 156, note: 'iTunes Search API · free',                color: 'bg-accent-amber-light text-accent-amber-dark' },
]

export default function SourcesPage() {
  return (
    <>
      <Topbar />
      <main className="max-w-3xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-medium tracking-tight mb-1">Data sources</h1>
        <p className="text-sm text-text-secondary mb-6">All active sources that feed the knowledge base.</p>

        <div className="space-y-2 mb-8">
          {SOURCES.map(src => (
            <div key={src.id} className="card px-4 py-4 flex items-center gap-4">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${src.color}`}>
                {src.name}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-secondary">{src.note}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-medium">{src.signals}</p>
                <p className="text-2xs text-text-tertiary">signals last scan</p>
              </div>
              <a href={src.url} target="_blank" rel="noopener noreferrer"
                className="btn-ghost p-2">
                <ExternalLink size={14} />
              </a>
            </div>
          ))}
        </div>

        <div className="card px-5 py-4">
          <h2 className="text-md font-medium mb-1">Knowledge base</h2>
          <p className="text-sm text-text-secondary mb-3">Each scan adds to the cumulative database. Accuracy improves over time.</p>
          <div className="flex gap-1 items-end h-10">
            {[30, 45, 38, 55, 62, 70, 78, 88, 95, 100].map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{ height: `${v}%`, background: `rgb(${15 + i * 5}, ${15 + i * 5}, ${15 + i * 5})` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-2xs text-text-tertiary mt-1.5">
            <span>Scan 1</span><span>Scan 10 (latest)</span>
          </div>
        </div>
      </main>
    </>
  )
}
