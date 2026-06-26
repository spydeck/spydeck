import type { ReactNode } from "react"

export function DetailMedia({
  image,
  video,
}: {
  image?: string | null
  video?: string | null
}) {
  if (video) {
    return (
      <video
        src={video}
        poster={image ?? undefined}
        controls
        className="max-h-80 w-full rounded-md border bg-muted"
      />
    )
  }
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className="max-h-80 w-full rounded-md border bg-muted object-contain"
      />
    )
  }
  return null
}

export function DetailField({
  label,
  value,
}: {
  label: string
  value?: ReactNode
}) {
  if (value == null || value === "") return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <div className="text-sm break-words whitespace-pre-wrap text-foreground">
        {value}
      </div>
    </div>
  )
}

export function DetailLink({
  label,
  href,
}: {
  label: string
  href?: string | null
}) {
  if (!href) return null
  return (
    <DetailField
      label={label}
      value={
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-primary hover:underline"
        >
          {href}
        </a>
      }
    />
  )
}

export function DetailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  )
}

export function StatGrid({
  stats,
}: {
  stats: { label: string; value?: ReactNode }[]
}) {
  const items = stats.filter((s) => s.value != null && s.value !== "")
  if (items.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((s) => (
        <DetailField key={s.label} label={s.label} value={s.value} />
      ))}
    </div>
  )
}
