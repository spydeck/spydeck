import type { PlatformKey } from "@/lib/authors"

export function formatDate(iso: string): string {
  // dd/mm/yyyy
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso))
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  }).format(new Date(iso))
}

const compactFmt = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})

export function formatCompact(n: number): string {
  return compactFmt.format(n)
}

export function postTypeLabel(platform: PlatformKey): string {
  switch (platform) {
    case "instagram":
      return "Reel"
    case "tiktok":
    case "youtube":
      return "Video"
    case "x":
      return "Tweet"
    case "facebook":
      return "Post"
    default:
      return "Post"
  }
}

export function toHandle(value: string | undefined, fallbackName: string): string {
  if (!value) {
    return "@" + fallbackName.toLowerCase().replace(/\s+/g, "")
  }

  // Strip URL down to last path segment
  let handle = value.trim()
  try {
    const url = new URL(handle)
    const segments = url.pathname.split("/").filter(Boolean)
    handle = segments[segments.length - 1] ?? handle
  } catch {
    // Not a URL — use as-is
  }

  // Ensure single leading @
  handle = handle.replace(/^@+/, "")
  return "@" + handle
}
