"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

export interface SwipeCategory {
  id: string
  name: string
  color: string | null
}

const KEY = ["swipe-ad-categories"]

export function useSwipeCategories() {
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<SwipeCategory[]>("/swipe-ads/categories"),
  })

  const create = useMutation({
    mutationFn: (input: { name: string; color?: string }) =>
      apiFetch<SwipeCategory>("/swipe-ads/categories", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })

  return {
    categories: data ?? [],
    // Get-or-create on the server; returns the category.
    createCategory: create.mutateAsync,
  }
}
