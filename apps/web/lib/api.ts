const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Typed fetch wrapper for the NestJS API.
 * `credentials: "include"` carries cookie sessions once custom auth lands.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText}: ${await res.text()}`);
  }

  // ponytail: Nest's scaffold root returns text/plain; real endpoints return JSON.
  const contentType = res.headers.get("content-type") ?? "";
  return (
    contentType.includes("application/json") ? res.json() : res.text()
  ) as Promise<T>;
}
