"use client"

import { FaLinkedin } from "react-icons/fa6"
import { SiGoogle, SiMeta, SiTiktok } from "react-icons/si"

import { SiteHeader } from "@/components/site-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GoogleAdsSearchPanel } from "./_components/google-ads-search-panel"
import { LinkedInAdsSearchPanel } from "./_components/linkedin-ads-search-panel"
import { MetaAdsSearchPanel } from "./_components/meta-ads-search-panel"
import { TikTokAdsSearchPanel } from "./_components/tiktok-ads-search-panel"

export default function SearchAdsPage() {
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

        <Tabs defaultValue="google" className="gap-6">
          <TabsList>
            <TabsTrigger value="google">
              <SiGoogle aria-hidden className="size-4" />
              Google
            </TabsTrigger>
            <TabsTrigger value="meta">
              <SiMeta aria-hidden className="size-4" />
              Meta
            </TabsTrigger>
            <TabsTrigger value="tiktok">
              <SiTiktok aria-hidden className="size-4" />
              TikTok
            </TabsTrigger>
            <TabsTrigger value="linkedin">
              <FaLinkedin aria-hidden className="size-4" />
              LinkedIn
            </TabsTrigger>
          </TabsList>
          <TabsContent value="google">
            <GoogleAdsSearchPanel />
          </TabsContent>
          <TabsContent value="meta">
            <MetaAdsSearchPanel />
          </TabsContent>
          <TabsContent value="tiktok">
            <TikTokAdsSearchPanel />
          </TabsContent>
          <TabsContent value="linkedin">
            <LinkedInAdsSearchPanel />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
