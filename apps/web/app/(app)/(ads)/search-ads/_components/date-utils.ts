import { format, isValid, parse, parseISO } from "date-fns"

// Matches ISO dates/timestamps (2025-08-10, 2025-08-10T07:00:00.000Z) or
// "Aug 10, 2025" substrings inside a label.
export const DATE_TOKEN =
  /\d{4}-\d{2}-\d{2}(?:T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?|[A-Z][a-z]{2,8} \d{1,2}, \d{4}/g

export function toDdMmYyyy(token: string): string {
  let d = parseISO(token)
  if (!isValid(d)) d = parse(token, "MMM d, yyyy", new Date())
  return isValid(d) ? format(d, "dd/MM/yyyy") : token
}

export function formatDateLabel(label?: string | null): string {
  if (!label) return "–"
  return label.replace(DATE_TOKEN, toDdMmYyyy)
}

// Timestamp of the first date in the label, for chronological column sorting.
export function dateSortValue(label?: string | null): number {
  const token = label?.match(DATE_TOKEN)?.[0]
  if (!token) return 0
  let d = parseISO(token)
  if (!isValid(d)) d = parse(token, "MMM d, yyyy", new Date())
  return isValid(d) ? d.getTime() : 0
}
