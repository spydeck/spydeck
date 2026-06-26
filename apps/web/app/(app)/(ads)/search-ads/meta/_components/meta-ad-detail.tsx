import {
  DetailField,
  DetailLink,
  DetailMedia,
  StatGrid,
} from "../../_components/ad-detail-parts"

interface MetaDetail {
  pageName?: string
  isActive?: boolean
  publisherPlatform?: string[]
  url?: string
  startDateString?: string
  endDateString?: string
  spend?: { lower_bound?: string; upper_bound?: string } | null
  snapshot?: {
    title?: string
    body?: string | { text?: string }
    caption?: string
    cta_text?: string
    cta_type?: string
    display_format?: string
    link_url?: string
    page_name?: string
    instagram_url?: string
    images?: { original_image_url?: string; resized_image_url?: string }[]
    videos?: {
      video_hd_url?: string
      video_sd_url?: string
      video_preview_image_url?: string
    }[]
  }
}

export function MetaAdDetail({ detail }: { detail: unknown }) {
  const d = detail as MetaDetail
  const snap = d.snapshot ?? {}
  const video = snap.videos?.[0]
  const image =
    video?.video_preview_image_url ??
    snap.images?.[0]?.original_image_url ??
    snap.images?.[0]?.resized_image_url
  const body = typeof snap.body === "string" ? snap.body : snap.body?.text
  const spend =
    d.spend?.lower_bound || d.spend?.upper_bound
      ? `$${d.spend.lower_bound ?? "?"}–$${d.spend.upper_bound ?? "?"}`
      : undefined
  const dateRange =
    d.startDateString || d.endDateString
      ? `${d.startDateString ?? "–"} – ${d.endDateString ?? "–"}`
      : undefined

  return (
    <div className="flex flex-col gap-5">
      <DetailMedia image={image} video={video?.video_hd_url ?? video?.video_sd_url} />

      <DetailField label="Headline" value={snap.title} />
      <DetailField label="Body" value={body} />
      <DetailField label="Caption" value={snap.caption} />

      <StatGrid
        stats={[
          { label: "Page", value: snap.page_name ?? d.pageName },
          { label: "Status", value: d.isActive ? "Active" : "Inactive" },
          { label: "Format", value: snap.display_format },
          { label: "Platforms", value: d.publisherPlatform?.join(", ") },
          { label: "Dates", value: dateRange },
          { label: "Spend", value: spend },
          { label: "CTA", value: snap.cta_text ?? snap.cta_type },
        ]}
      />

      <DetailLink label="Destination URL" href={snap.link_url} />
      <DetailLink label="Instagram" href={snap.instagram_url} />
      <DetailLink label="Ad Library URL" href={d.url} />
    </div>
  )
}
