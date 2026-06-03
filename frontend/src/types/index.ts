export type Category = 'ai_saas' | 'health' | 'b2b' | 'creator' | 'ecommerce' | 'fintech' | 'devtools' | 'other'
export type Competition = 'low' | 'medium' | 'high'
export type ScanStatus = 'running' | 'done' | 'failed'

export interface Niche {
  id: string
  name: string
  category: Category
  why_summary: string
  signal_score: number
  fit_score: number
  mvp_weeks: number
  competition: Competition
  tags: string[]
  created_at: string
  signals?: Signal[]
  competitors?: Competitor[]
}

export interface Signal {
  id: string
  source: 'reddit' | 'trends' | 'producthunt' | 'meta_ads' | 'appstore'
  source_url: string | null
  title: string | null
  content: string | null
  metadata: Record<string, unknown>
  niche_id: string
  created_at: string
}

export interface Competitor {
  id: string
  niche_id: string
  name: string
  website: string | null
  arr_estimate: string | null
  funding: string | null
  gaps: string[]
  strengths: string[]
  ph_url: string | null
  li_url: string | null
}

export interface Scan {
  id: string
  status: ScanStatus
  sources_done: string[]
  niches_found: number
  signals_found: number
  triggered_by: string
  started_at: string
  finished_at: string | null
}

export interface RoadmapPhase {
  week_label: string
  title: string
  why: string
  tasks: string[]
  tools: { name: string; cost: string; url: string; why: string }[]
  risks: string[]
}

export interface Roadmap {
  phases: RoadmapPhase[]
  total_monthly_cost: string
  break_even_customers: number
}

export interface Profile {
  id: string
  username: string | null
  expertise: string[]
  budget_range: string | null
  looking_for: string[]
  bio: string | null
  avatar_url: string | null
}

export interface Reaction {
  user_id: string
  niche_id: string
  reaction: 'real' | 'not_real' | 'interested'
  comment: string | null
}

export interface ReactionCounts {
  real: number
  not_real: number
  interested: number
}
