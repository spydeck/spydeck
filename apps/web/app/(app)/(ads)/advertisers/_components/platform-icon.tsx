import type { IconType } from "react-icons"
import { FaLinkedin } from "react-icons/fa6"
import { SiGoogle, SiMeta, SiTiktok } from "react-icons/si"
import type { AdvertiserPlatform } from "@/lib/advertisers"

const ICONS: Record<AdvertiserPlatform, IconType> = {
  linkedin: FaLinkedin,
  meta: SiMeta,
  google: SiGoogle,
  tiktok: SiTiktok,
}

export function PlatformIcon({
  platform,
  className,
}: {
  platform: AdvertiserPlatform
  className?: string
}) {
  const Icon = ICONS[platform]
  return <Icon className={className} aria-label={platform} />
}
