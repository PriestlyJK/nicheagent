import useSWR, { mutate } from 'swr'
import * as api from '@/lib/api'
import type { Niche, Scan, Roadmap } from '@/types'
import { useState, useCallback } from 'react'

// ── Niches ──────────────────────────────────────────────────────
export function useNiches(params?: { category?: string; sort_by?: string }) {
  const key = ['niches', params]
  const { data, error, isLoading } = useSWR<Niche[]>(
    key,
    () => api.getNiches(params),
    { refreshInterval: 60_000 }
  )
  return { niches: data ?? [], error, isLoading }
}

export function useNiche(id: string | null) {
  const { data, error, isLoading } = useSWR(
    id ? ['niche', id] : null,
    () => api.getNiche(id!),
  )
  return { niche: data, error, isLoading }
}

// ── Scan ────────────────────────────────────────────────────────
export function useScan() {
  const [scanId, setScanId] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  const { data: scan } = useSWR<Scan>(
    scanId ? ['scan', scanId] : null,
    () => api.getScanStatus(scanId!),
    {
      refreshInterval: (data) => {
        if (data?.status === 'running') return 2000
        if (data?.status === 'done') {
          setScanning(false)
          mutate(['niches', undefined])
          return 0
        }
        return 0
      },
    }
  )

  const trigger = useCallback(async () => {
    setScanning(true)
    const s = await api.triggerScan()
    setScanId(s.id)
  }, [])

  return { scan, scanning, trigger }
}

// ── Roadmap ─────────────────────────────────────────────────────
export function useRoadmap(nicheId: string | null, params: {
  budget: string; team: string; timeline_weeks: number
}) {
  const key = nicheId ? ['roadmap', nicheId, params] : null
  const { data, error, isLoading } = useSWR<Roadmap>(
    key,
    () => api.getRoadmap(nicheId!, params),
    { revalidateOnFocus: false }
  )
  return { roadmap: data, error, isLoading }
}

// ── Saved ───────────────────────────────────────────────────────
export function useSaved(userId: string | null) {
  const { data, mutate: refresh } = useSWR(
    userId ? ['saved', userId] : null,
    () => api.getSavedNiches(userId!),
  )
  const savedIds = new Set((data ?? []).map((s: { niche_id: string }) => s.niche_id))

  const toggle = useCallback(async (nicheId: string) => {
    if (!userId) return
    if (savedIds.has(nicheId)) {
      await api.unsaveNiche(userId, nicheId)
    } else {
      await api.saveNiche(userId, nicheId)
    }
    refresh()
  }, [userId, savedIds, refresh])

  return { saved: data ?? [], savedIds, toggle }
}
