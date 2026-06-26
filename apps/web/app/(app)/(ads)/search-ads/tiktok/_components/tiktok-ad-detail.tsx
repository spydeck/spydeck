import {
  DetailField,
  DetailLink,
  DetailMedia,
  DetailSection,
  StatGrid,
} from "../../_components/ad-detail-parts"
import { formatCompact } from "./tiktok-ad"

interface TikTokDetail {
  ad_title?: string
  brand_name?: string
  like?: number
  comment?: number
  share?: number
  ctr?: number
  cost?: number
  industry_key?: string
  objective_key?: string
  highlight_text?: string
  landing_page?: string
  creative_center_url?: string
  country_code?: string[]
  objectives?: { label: string; value: number }[]
  video_info?: {
    cover?: string
    duration?: number
    video_url?: string | Record<string, string>
  }
}

// video_url may be a string or a map of resolution → url; pick the first usable url.
function pickVideoUrl(v: TikTokDetail["video_info"]): string | undefined {
  const url = v?.video_url
  if (!url) return undefined
  if (typeof url === "string") return url
  return Object.values(url).find((u) => typeof u === "string" && u.startsWith("http"))
}

export function TikTokAdDetail({ detail }: { detail: unknown }) {
  const d = detail as TikTokDetail
  const objectives = d.objectives ?? []

  return (
    <div className="flex flex-col gap-5">
      <DetailMedia image={d.video_info?.cover} video={pickVideoUrl(d.video_info)} />

      <DetailField label="Title" value={d.ad_title} />
      <DetailField label="Highlight" value={d.highlight_text} />

      <StatGrid
        stats={[
          { label: "Brand", value: d.brand_name },
          { label: "Industry", value: d.industry_key },
          { label: "Objective", value: d.objective_key },
          { label: "Likes", value: d.like != null ? formatCompact(d.like) : undefined },
          { label: "Comments", value: d.comment != null ? formatCompact(d.comment) : undefined },
          { label: "Shares", value: d.share != null ? formatCompact(d.share) : undefined },
          { label: "CTR", value: d.ctr != null ? `${(d.ctr * 100).toFixed(1)}%` : undefined },
          { label: "Cost", value: d.cost != null ? `$${formatCompact(d.cost)}` : undefined },
          { label: "Countries", value: d.country_code?.join(", ") },
        ]}
      />

      {objectives.length > 0 && (
        <DetailSection title="Objectives">
          <div className="flex flex-col gap-1">
            {objectives.map((o) => (
              <div key={o.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{o.label}</span>
                <span className="font-medium text-foreground">
                  {formatCompact(o.value)}
                </span>
              </div>
            ))}
          </div>
        </DetailSection>
      )}

      <DetailLink label="Landing page" href={d.landing_page} />
      <DetailLink label="Creative Center" href={d.creative_center_url} />
    </div>
  )
}
