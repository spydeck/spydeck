import {
  DetailField,
  DetailLink,
  DetailMedia,
  DetailSection,
  StatGrid,
} from "../../_components/ad-detail-parts"

interface LinkedInDetail {
  description?: string
  headline?: string
  image?: string
  video?: string | null
  adType?: string
  advertiser?: string
  poster?: string
  posterTitle?: string
  advertiserLinkedinPage?: string
  destinationUrl?: string
  cta?: string | null
  adDuration?: string
  startDate?: string
  endDate?: string
  totalImpressions?: string | number
  targeting?: {
    language?: string
    location?: string
    audience?: string
    company?: string
  }
  impressionsByCountry?: { country: string; impressions: string }[]
}

export function LinkedInAdDetail({ detail }: { detail: unknown }) {
  const d = detail as LinkedInDetail
  const targeting = d.targeting ?? {}
  const byCountry = d.impressionsByCountry ?? []

  return (
    <div className="flex flex-col gap-5">
      <DetailMedia image={d.image} video={d.video} />

      <DetailField label="Description" value={d.description} />

      <StatGrid
        stats={[
          { label: "Advertiser", value: d.advertiser ?? d.poster },
          { label: "Ad type", value: d.adType },
          { label: "Status", value: d.posterTitle },
          { label: "Total impressions", value: d.totalImpressions },
          { label: "Duration", value: d.adDuration },
          { label: "CTA", value: d.cta },
        ]}
      />

      {(targeting.language || targeting.location || targeting.audience || targeting.company) && (
        <DetailSection title="Targeting">
          <DetailField label="Language" value={targeting.language} />
          <DetailField label="Location" value={targeting.location} />
          <DetailField label="Audience" value={targeting.audience} />
          <DetailField label="Company" value={targeting.company} />
        </DetailSection>
      )}

      {byCountry.length > 0 && (
        <DetailSection title="Impressions by country">
          <div className="flex flex-col gap-1">
            {byCountry.map((c) => (
              <div
                key={c.country}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{c.country}</span>
                <span className="font-medium text-foreground">{c.impressions}</span>
              </div>
            ))}
          </div>
        </DetailSection>
      )}

      <DetailLink label="Destination URL" href={d.destinationUrl} />
      <DetailLink label="Advertiser page" href={d.advertiserLinkedinPage} />
    </div>
  )
}
