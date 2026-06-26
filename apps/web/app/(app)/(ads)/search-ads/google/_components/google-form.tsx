"use client"

import { SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CountrySelect } from "@/components/country-select"
import { DateRangeSelect } from "@/components/date-range-select"
import { GoogleAdvertiserSelect } from "./google-advertiser-search"
import type { Advertiser, GoogleForm as GoogleFormState } from "./google-ad"

export function GoogleForm({
  form,
  onChange,
  onAdvertiser,
  onSubmit,
  canSubmit,
}: {
  form: GoogleFormState
  onChange: (field: keyof GoogleFormState, value: string) => void
  onAdvertiser: (advertiser: Advertiser | null) => void
  onSubmit: (e: React.FormEvent) => void
  canSubmit: boolean
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <GoogleAdvertiserSelect
          label={form.advertiserName}
          region={form.region}
          onChange={onAdvertiser}
          className="w-full sm:flex-1"
        />
        <Input
          value={form.domain}
          onChange={(e) => onChange("domain", e.target.value)}
          placeholder="or domain (e.g. nike.com)"
          className="w-full sm:w-56"
          aria-label="Company domain"
        />
        <Button type="submit" disabled={!canSubmit}>
          <SearchIcon data-icon="inline-start" />
          Search
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Select
          value={form.format || "ALL"}
          onValueChange={(v) => onChange("format", v === "ALL" ? "" : v)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All formats</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
        <CountrySelect
          value={form.region}
          onChange={(v) => onChange("region", v)}
          placeholder="Region"
          allowEmpty
          className="w-full sm:w-40"
        />
        <DateRangeSelect
          value={{ from: form.startDate, to: form.endDate }}
          onChange={(range) => {
            onChange("startDate", range.from)
            onChange("endDate", range.to)
          }}
          className="w-full sm:w-64"
        />
      </div>
    </form>
  )
}
