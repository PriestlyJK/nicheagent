import type { Niche, Scan, Roadmap, Profile, ReactionCounts } from '@/types'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

// ── Niches ──────────────────────────────────────────────────────
export const getNiches = (params?: {
  category?: string
  sort_by?: string
  limit?: number
}) => {
  const qs = new URLSearchParams(params as Record<string, string>).toString()
  return req<Niche[]>(`/api/niches${qs ? '?' + qs : ''}`)
}

export const getNiche = (id: string) =>
  req<Niche & { signals: unknown[]; competitors: unknown[] }>(`/api/niches/${id}`)

export const triggerScan = () =>
  req<Scan>('/api/niches/scan', { method: 'POST' })

export const getScanStatus = (scanId: string) =>
  req<Scan>(`/api/niches/scan/${scanId}`)

export const getRoadmap = (
  nicheId: string,
  params: { budget: string; team: string; timeline_weeks: number }
) => {
  const qs = new URLSearchParams(params as Record<string, string>).toString()
  return req<Roadmap>(`/api/niches/${nicheId}/roadmap?${qs}`)
}

// ── Users ────────────────────────────────────────────────────────
export const getProfile = (userId: string) =>
  req<Profile>(`/api/users/profile/${userId}`)

export const updateProfile = (userId: string, data: Partial<Profile>) =>
  req<Profile>(`/api/users/profile/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const getSavedNiches = (userId: string) =>
  req<{ niche_id: string; saved_at: string; niches: Niche }[]>(
    `/api/users/profile/${userId}/saved`
  )

export const saveNiche = (userId: string, nicheId: string) =>
  req(`/api/users/profile/${userId}/saved/${nicheId}`, { method: 'POST' })

export const unsaveNiche = (userId: string, nicheId: string) =>
  req(`/api/users/profile/${userId}/saved/${nicheId}`, { method: 'DELETE' })

// ── Social ───────────────────────────────────────────────────────
export const getReactions = (nicheId: string) =>
  req<{ counts: ReactionCounts; reactions: unknown[] }>(`/api/social/reactions/${nicheId}`)

export const addReaction = (
  userId: string,
  nicheId: string,
  reaction: 'real' | 'not_real' | 'interested',
  comment?: string
) =>
  req('/api/social/reactions', {
    method: 'POST',
    headers: { 'x-user-id': userId },
    body: JSON.stringify({ niche_id: nicheId, reaction, comment }),
  })
