"use client"

import { SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateRangeSelect } from "@/components/date-range-select"
import { CountrySelect } from "@/components/country-select"

export interface FormState {
  company: string
  keyword: string
  companyId: string
  countries: string
  startDate: string
  endDate: string
}

export const defaultForm: FormState = {
  company: "",
  keyword: "",
  companyId: "",
  countries: "",
  startDate: "",
  endDate: "",
}

export function LinkedInForm({
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={form.keyword}
            onChange={(e) => onChange("keyword", e.target.value)}
            placeholder="Keyword"
            className="pl-8"
            aria-label="Keyword"
          />
        </div>
        <Input
          value={form.company}
          onChange={(e) => onChange("company", e.target.value)}
          placeholder="Company name"
          className="w-full sm:w-44"
          aria-label="Company name"
        />
        <Input
          value={form.companyId}
          onChange={(e) => onChange("companyId", e.target.value)}
          placeholder="Company ID"
          className="w-full sm:w-36"
          aria-label="Company ID"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <CountrySelect
          value={form.countries}
          onChange={(v) => onChange("countries", v)}
          placeholder="Country"
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
        <Button type="submit" disabled={!canSubmit}>
          <SearchIcon data-icon="inline-start" />
          Search
        </Button>
      </div>
    </form>
  )
}
