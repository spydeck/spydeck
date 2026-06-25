import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";

/** Smoke-test hook: hits the NestJS root to prove the data layer is wired. */
export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => apiFetch<string>("/"),
  });
}
