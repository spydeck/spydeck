import {
  DetailField,
  DetailLink,
  DetailMedia,
  DetailSection,
  StatGrid,
} from "../../_components/ad-detail-parts"

interface GoogleDetail {
  advertiserId?: string
  creativeId?: string
  firstShown?: string | null
  lastShown?: string | null
  format?: string
  overallImpressions?: { min?: number | null; max?: number | null }
  creativeRegions?: { regionCode: string; regionName: string }[]
  variations?: {
    destinationUrl?: string
    headline?: string
    description?: string
    allText?: string
    imageUrl?: string
  }[]
}

export function GoogleAdDetail({ detail }: { detail: unknown }) {
  const d = detail as GoogleDetail
  const variations = d.variations ?? []
  const regions = d.creativeRegions ?? []
  const imp = d.overallImpressions
  const impressions =
    imp && (imp.min != null || imp.max != null)
      ? `${imp.min ?? "?"} – ${imp.max ?? "?"}`
      : undefined

  return (
    <div className="flex flex-col gap-5">
      <StatGrid
        stats={[
          { label: "Format", value: d.format },
          { label: "Impressions", value: impressions },
          { label: "First shown", value: d.firstShown ?? undefined },
          { label: "Last shown", value: d.lastShown ?? undefined },
          { label: "Advertiser ID", value: d.advertiserId },
          { label: "Creative ID", value: d.creativeId },
        ]}
      />

      {variations.length > 0 && (
        <DetailSection title={`Creatives (${variations.length})`}>
          <div className="flex flex-col gap-4">
            {variations.map((v, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3"
              >
                <DetailMedia image={v.imageUrl} />
                <DetailField label="Headline" value={v.headline} />
                <DetailField label="Description" value={v.description} />
                <DetailLink label="Destination URL" href={v.destinationUrl} />
              </div>
            ))}
          </div>
        </DetailSection>
      )}

      {regions.length > 0 && (
        <DetailField
          label="Regions"
          value={regions.map((r) => r.regionName).join(", ")}
        />
      )}
    </div>
  )
}
