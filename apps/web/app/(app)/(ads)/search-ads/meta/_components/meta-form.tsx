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

export interface FormState {
  query: string
  country: string
  status: string
  media_type: string
  ad_type: string
  start_date: string
  end_date: string
}

export const defaultForm: FormState = {
  query: "",
  country: "",
  status: "ALL",
  media_type: "ALL",
  ad_type: "ALL",
  start_date: "",
  end_date: "",
}

export function MetaForm({
  form,
  onChange,
  onSubmit,
  canSubmit,
}: {
  form: FormState
  onChange: (field: keyof FormState, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  canSubmit: boolean
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={form.query}
            onChange={(e) => onChange("query", e.target.value)}
            placeholder="Search Meta ads..."
            className="pl-8"
            aria-label="Search query"
          />
        </div>
        <CountrySelect
          value={form.country}
          onChange={(v) => onChange("country", v)}
          placeholder="Country"
          allowEmpty
          className="w-full sm:w-36"
        />
        <Button type="submit" disabled={!canSubmit}>
          <SearchIcon data-icon="inline-start" />
          Search
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Select value={form.status} onValueChange={(v) => onChange("status", v)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={form.media_type} onValueChange={(v) => onChange("media_type", v)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Media type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All media</SelectItem>
            <SelectItem value="IMAGE">Image</SelectItem>
            <SelectItem value="VIDEO">Video</SelectItem>
            <SelectItem value="MEME">Meme</SelectItem>
          </SelectContent>
        </Select>

        <Select value={form.ad_type} onValueChange={(v) => onChange("ad_type", v)}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Ad type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="POLITICAL_AND_ISSUE_ADS">Political & Issue</SelectItem>
          </SelectContent>
        </Select>

        <DateRangeSelect
          value={{ from: form.start_date, to: form.end_date }}
          onChange={(range) => {
            onChange("start_date", range.from)
            onChange("end_date", range.to)
          }}
          className="w-full sm:w-64"
        />
      </div>
    </form>
  )
}
