"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { IconType } from "react-icons"
import { FaLinkedin } from "react-icons/fa6"
import { SiGoogle, SiMeta, SiTiktok } from "react-icons/si"
import { cn } from "@/lib/utils"

const PLATFORMS: { href: string; label: string; Icon: IconType }[] = [
  { href: "/search-ads/google", label: "Google", Icon: SiGoogle },
  { href: "/search-ads/meta", label: "Meta", Icon: SiMeta },
  { href: "/search-ads/tiktok", label: "TikTok", Icon: SiTiktok },
  { href: "/search-ads/linkedin", label: "LinkedIn", Icon: FaLinkedin },
]

export function PlatformNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-muted text-muted-foreground inline-flex w-fit items-center gap-1 rounded-lg p-1">
      {PLATFORMS.map(({ href, label, Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
              active
                ? "bg-background text-foreground shadow-sm"
                : "hover:text-foreground"
            )}
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
