import { SiteHeader } from "@/components/site-header"
import { PlatformNav } from "./_components/platform-nav"

export default function SearchAdsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader title="Search Ads" />
      <div className="flex flex-1 flex-col gap-6 px-4 py-10">
        <div>
          <h1 className="text-xl font-semibold">Search Ads</h1>
          <p className="text-sm text-muted-foreground">
            Browse and filter ads from across platforms.
          </p>
        </div>
        <PlatformNav />
        {children}
      </div>
    </>
  )
}
