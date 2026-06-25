export type AdPlatform = "Meta" | "TikTok" | "YouTube" | "Google" | "LinkedIn"

export type AdStatus = "Active" | "Paused" | "Ended"

export interface AdResult {
  id: string
  title: string
  advertiser: string
  platform: AdPlatform
  status: AdStatus
  description: string
  thumbnailUrl: string | null
  date: string
  impressions: number
  spend: number
}

// ponytail: static mock data — no backend wiring per task spec.
export const mockAds: AdResult[] = [
  {
    id: "ad-001",
    title: "Summer Sale 50% Off",
    advertiser: "Brightway Apparel",
    platform: "Meta",
    status: "Active",
    description:
      "Video carousel ad promoting the summer collection with a limited-time discount code.",
    thumbnailUrl: null,
    date: "2026-06-18",
    impressions: 184000,
    spend: 4200,
  },
  {
    id: "ad-002",
    title: "New Flavor Drop",
    advertiser: "Pureleaf Kombucha",
    platform: "TikTok",
    status: "Active",
    description:
      "Creator-led short video announcing a new flavor with a hashtag challenge.",
    thumbnailUrl: null,
    date: "2026-06-15",
    impressions: 96500,
    spend: 1800,
  },
  {
    id: "ad-003",
    title: "Spring Collection Lookbook",
    advertiser: "Nordwind Home",
    platform: "YouTube",
    status: "Paused",
    description:
      "15-second pre-roll showcasing the spring home decor lineup with a shop-now CTA.",
    thumbnailUrl: null,
    date: "2026-05-28",
    impressions: 312000,
    spend: 7600,
  },
  {
    id: "ad-004",
    title: "Free Trial Signup",
    advertiser: "Cohort Analytics",
    platform: "Google",
    status: "Active",
    description:
      "Search ad targeting SaaS analytics keywords with a 14-day free trial landing page.",
    thumbnailUrl: null,
    date: "2026-06-20",
    impressions: 54000,
    spend: 3100,
  },
  {
    id: "ad-005",
    title: "Hiring Senior Engineers",
    advertiser: "Helix Robotics",
    platform: "LinkedIn",
    status: "Ended",
    description:
      "Sponsored recruitment campaign targeting robotics engineers in three regions.",
    thumbnailUrl: null,
    date: "2026-04-30",
    impressions: 42800,
    spend: 5400,
  },
  {
    id: "ad-006",
    title: "Weekend Flash Deal",
    advertiser: "Brightway Apparel",
    platform: "Meta",
    status: "Ended",
    description:
      "Static image ad pushing a 48-hour weekend flash sale across retargeting audiences.",
    thumbnailUrl: null,
    date: "2026-05-10",
    impressions: 127000,
    spend: 2900,
  },
  {
    id: "ad-007",
    title: "Product Demo Webinar",
    advertiser: "Cohort Analytics",
    platform: "LinkedIn",
    status: "Active",
    description:
      "Lead-gen form ad driving registrations for a live product demo webinar.",
    thumbnailUrl: null,
    date: "2026-06-22",
    impressions: 38200,
    spend: 4100,
  },
  {
    id: "ad-008",
    title: "Influencer Restock Alert",
    advertiser: "Pureleaf Kombucha",
    platform: "TikTok",
    status: "Paused",
    description:
      "Spark Ads boosting an influencer post announcing a restock of a bestseller flavor.",
    thumbnailUrl: null,
    date: "2026-06-05",
    impressions: 71000,
    spend: 1500,
  },
]

export const platformOptions: AdPlatform[] = [
  "Meta",
  "TikTok",
  "YouTube",
  "Google",
  "LinkedIn",
]

export const statusOptions: AdStatus[] = ["Active", "Paused", "Ended"]