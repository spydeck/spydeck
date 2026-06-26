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

export interface FormState {
  query: string
  region: string
  period: string
  order_by: string
  ad_format: string
}

export const defaultForm: FormState = {
  query: "",
  region: "US",
  period: "30",
  order_by: "for_you",
  ad_format: "ALL",
}

export function TikTokForm({
  form,
  onChange,
  onSubmit,
}: {
  form: FormState
  onChange: (field: keyof FormState, value: string) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={form.query}
            onChange={(e) => onChange("query", e.target.value)}
            placeholder="Keyword (optional)"
            className="pl-8"
            aria-label="Search query"
          />
        </div>
        <CountrySelect
          value={form.region}
          onChange={(v) => onChange("region", v)}
          placeholder="Region"
          allowEmpty
          className="w-full sm:w-32"
        />
        <Button type="submit">
          <SearchIcon data-icon="inline-start" />
          Search
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={form.period} onValueChange={(v) => onChange("period", v)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="180">Last 180 days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={form.order_by} onValueChange={(v) => onChange("order_by", v)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="for_you">For you</SelectItem>
            <SelectItem value="like">Likes</SelectItem>
            <SelectItem value="ctr">CTR</SelectItem>
            <SelectItem value="cost">Cost</SelectItem>
          </SelectContent>
        </Select>

        <Select value={form.ad_format} onValueChange={(v) => onChange("ad_format", v)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All formats</SelectItem>
            <SelectItem value="SINGLE_VIDEO">Single video</SelectItem>
            <SelectItem value="IMAGE">Image</SelectItem>
            <SelectItem value="SPARK_ADS">Spark ads</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </form>
  )
}
