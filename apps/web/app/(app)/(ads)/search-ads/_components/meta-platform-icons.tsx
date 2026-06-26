import type { ComponentType, SVGProps } from "react"
import { FaThreads } from "react-icons/fa6"
import {
  SiFacebook,
  SiInstagram,
  SiMessenger,
  SiMeta,
  SiWhatsapp,
} from "react-icons/si"

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

const ICONS: Record<string, { Icon: IconComponent; label: string; color: string }> = {
  FACEBOOK: { Icon: SiFacebook, label: "Facebook", color: "text-[#1877F2]" },
  INSTAGRAM: { Icon: SiInstagram, label: "Instagram", color: "text-[#E4405F]" },
  MESSENGER: { Icon: SiMessenger, label: "Messenger", color: "text-[#0084FF]" },
  WHATSAPP: { Icon: SiWhatsapp, label: "WhatsApp", color: "text-[#25D366]" },
  THREADS: { Icon: FaThreads, label: "Threads", color: "text-foreground" },
  AUDIENCE_NETWORK: { Icon: SiMeta, label: "Audience Network", color: "text-[#0866FF]" },
}

export function MetaPlatformIcons({ value }: { value: string }) {
  const platforms = value.split(",").map((p) => p.trim()).filter(Boolean)
  if (platforms.length === 0) return null
  return (
    <span className="inline-flex items-center gap-1.5">
      {platforms.map((p) => {
        const entry = ICONS[p.toUpperCase()]
        if (!entry) {
          return (
            <span
              key={p}
              title={p}
              className="text-[10px] font-medium uppercase text-muted-foreground"
            >
              {p}
            </span>
          )
        }
        const { Icon, label, color } = entry
        return (
          <span key={p} title={label} className="inline-flex">
            <Icon aria-label={label} className={`size-3.5 ${color}`} />
          </span>
        )
      })}
    </span>
  )
}
