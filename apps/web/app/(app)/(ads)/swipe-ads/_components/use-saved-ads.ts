"use client"

import { useCallback, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { NormalizedAd } from "../../search-ads/_components/normalized-ad"

export interface SwipeAdRow {
  id: string
  adId: string
  ad: NormalizedAd
  source: "manual" | "telegram"
  categoryId: string | null
  createdAt: string
}

const KEY = ["swipe-ads"]

export function useSavedAds() {
  const qc = useQueryClient()

  const { data, isPending } = useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<SwipeAdRow[]>("/swipe-ads"),
  })
  const rows = useMemo(() => data ?? [], [data])
  const ads = useMemo(() => rows.map((r) => r.ad), [rows])
  const savedIds = useMemo(() => new Set(rows.map((r) => r.adId)), [rows])

  const invalidate = () => qc.invalidateQueries({ queryKey: KEY })

  const saveMutation = useMutation({
    mutationFn: (ad: NormalizedAd) =>
      apiFetch("/swipe-ads", { method: "POST", body: JSON.stringify({ ad }) }),
    onSuccess: invalidate,
  })

  const removeMutation = useMutation({
    mutationFn: (adId: string) =>
      apiFetch(`/swipe-ads/${encodeURIComponent(adId)}`, { method: "DELETE" }),
    onSuccess: invalidate,
  })

  const setCategoryMutation = useMutation({
    mutationFn: (vars: { adIds: string[]; categoryId: string | null }) =>
      Promise.all(
        vars.adIds.map((adId) =>
          apiFetch(`/swipe-ads/${encodeURIComponent(adId)}/category`, {
            method: "PATCH",
            body: JSON.stringify({ categoryId: vars.categoryId }),
          })
        )
      ),
    onSuccess: invalidate,
  })

  const saveAd = useCallback(
    (ad: NormalizedAd) => {
      if (!savedIds.has(ad.id)) saveMutation.mutate(ad)
    },
    [savedIds, saveMutation]
  )

  const toggleAd = useCallback(
    (ad: NormalizedAd) => {
      if (savedIds.has(ad.id)) removeMutation.mutate(ad.id)
      else saveMutation.mutate(ad)
    },
    [savedIds, saveMutation, removeMutation]
  )

  const removeAd = useCallback(
    (adId: string) => removeMutation.mutate(adId),
    [removeMutation]
  )

  // Bulk add (optionally into a category). Re-adds even if already saved so the
  // category gets (re)assigned server-side.
  const addAds = useCallback(
    async (list: NormalizedAd[], categoryId?: string) => {
      await Promise.all(
        list.map((ad) =>
          apiFetch("/swipe-ads", {
            method: "POST",
            body: JSON.stringify({ ad, categoryId }),
          })
        )
      )
      invalidate()
    },
    [qc] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const setCategory = useCallback(
    (adIds: string[], categoryId: string | null) =>
      setCategoryMutation.mutateAsync({ adIds, categoryId }),
    [setCategoryMutation]
  )

  return {
    ads,
    rows,
    loaded: !isPending,
    savedIds,
    saveAd,
    toggleAd,
    removeAd,
    addAds,
    setCategory,
  }
}
