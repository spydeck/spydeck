"use client"

import * as React from "react"
import type { DateRange as RdpDateRange } from "react-day-picker"
import { CalendarIcon, ChevronsUpDownIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DateRange {
  /** Inclusive start, "YYYY-MM-DD". Empty string = unset. */
  from: string
  /** Inclusive end, "YYYY-MM-DD". Empty string = unset. */
  to: string
}

export const EMPTY_DATE_RANGE: DateRange = { from: "", to: "" }

// All presets are calendar-aligned so they agree with "previous quarter".
// "this *" run from the period start to today; "last *" are the full prior period.
const PRESETS: { label: string; compute: (today: Date) => DateRange }[] = [
  { label: "Today", compute: todayRange },
  { label: "This week", compute: thisWeek },
  { label: "Last week", compute: lastWeek },
  { label: "This month", compute: thisMonth },
  { label: "Last month", compute: lastMonth },
  { label: "This quarter", compute: thisQuarter },
  { label: "Previous quarter", compute: previousQuarter },
  { label: "This year", compute: thisYear },
]

interface DateRangeSelectProps {
  value: DateRange
  onChange: (value: DateRange) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DateRangeSelect({
  value,
  onChange,
  placeholder = "Date range",
  className,
  disabled,
}: DateRangeSelectProps) {
  const [open, setOpen] = React.useState(false)

  const selected: RdpDateRange | undefined =
    value.from || value.to
      ? { from: parse(value.from), to: parse(value.to) }
      : undefined

  function applyPreset(compute: (today: Date) => DateRange) {
    onChange(compute(startOfDay(new Date())))
    setOpen(false)
  }

  const label =
    value.from && value.to
      ? `${formatLabel(value.from)} – ${formatLabel(value.to)}`
      : value.from
        ? `From ${formatLabel(value.from)}`
        : value.to
          ? `Until ${formatLabel(value.to)}`
          : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-expanded={open}
          disabled={disabled}
          className={cn("justify-between font-normal", className)}
        >
          <span className="flex min-w-0 items-center gap-2">
            <CalendarIcon
              className={cn("size-4 shrink-0", !label && "text-muted-foreground")}
            />
            <span className={cn("truncate", !label && "text-muted-foreground")}>
              {label ?? placeholder}
            </span>
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-col p-2 sm:border-r">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start font-normal"
                onClick={() => applyPreset(preset.compute)}
              >
                {preset.label}
              </Button>
            ))}
            {(value.from || value.to) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-auto justify-start font-normal text-muted-foreground"
                onClick={() => onChange(EMPTY_DATE_RANGE)}
              >
                <XIcon className="size-4" />
                Clear
              </Button>
            )}
          </div>
          <Calendar
            mode="range"
            numberOfMonths={2}
            defaultMonth={selected?.from}
            selected={selected}
            onSelect={(range) =>
              onChange({
                from: range?.from ? fmt(range.from) : "",
                to: range?.to ? fmt(range.to) : "",
              })
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

// --- date helpers (local time, "YYYY-MM-DD") ---

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)
}

function parse(value: string): Date | undefined {
  if (!value) return undefined
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function fmt(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

function formatLabel(value: string): string {
  const d = parse(value)
  return d
    ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : value
}

function todayRange(today: Date): DateRange {
  const d = fmt(today)
  return { from: d, to: d }
}

// Start of the current calendar week (Monday) through today.
function thisWeek(today: Date): DateRange {
  const daysSinceMonday = (today.getDay() + 6) % 7
  return { from: fmt(addDays(today, -daysSinceMonday)), to: fmt(today) }
}

// Start of the current month through today.
function thisMonth(today: Date): DateRange {
  const first = new Date(today.getFullYear(), today.getMonth(), 1)
  return { from: fmt(first), to: fmt(today) }
}

// Previous full calendar week, Monday–Sunday.
function lastWeek(today: Date): DateRange {
  const daysSinceMonday = (today.getDay() + 6) % 7
  const thisMonday = addDays(today, -daysSinceMonday)
  return { from: fmt(addDays(thisMonday, -7)), to: fmt(addDays(thisMonday, -1)) }
}

// Previous full calendar month.
function lastMonth(today: Date): DateRange {
  const first = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const last = new Date(today.getFullYear(), today.getMonth(), 0)
  return { from: fmt(first), to: fmt(last) }
}

// Start of the current quarter through today.
function thisQuarter(today: Date): DateRange {
  const first = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
  return { from: fmt(first), to: fmt(today) }
}

// Previous full calendar quarter.
function previousQuarter(today: Date): DateRange {
  const firstOfThis = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
  const first = new Date(firstOfThis.getFullYear(), firstOfThis.getMonth() - 3, 1)
  const last = new Date(firstOfThis.getFullYear(), firstOfThis.getMonth(), 0)
  return { from: fmt(first), to: fmt(last) }
}

// Jan 1 of the current year through today.
function thisYear(today: Date): DateRange {
  return { from: fmt(new Date(today.getFullYear(), 0, 1)), to: fmt(today) }
}
