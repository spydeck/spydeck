"use client"

import { SiteHeader } from "@/components/site-header"
import { AddAdvertiserDialog } from "./_components/add-advertiser-dialog"
import { AdvertisersTable } from "./_components/advertisers-table"

export default function AdvertisersPage() {
  return (
    <>
      <SiteHeader title="Advertisers" />
      <div className="flex flex-1 flex-col gap-6 px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Advertisers</h1>
            <p className="text-sm text-muted-foreground">
              Track companies across ad platforms and browse their ads.
            </p>
          </div>
          <AddAdvertiserDialog />
        </div>
        <AdvertisersTable />
      </div>
    </>
  )
}
