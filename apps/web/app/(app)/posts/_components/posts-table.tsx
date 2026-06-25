"use client"

import Image from "next/image"
import React from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { Heart, MessageCircle, Eye, Forward } from "lucide-react"

import { DataTable } from "@/components/ui/data-table"
import { Checkbox } from "@/components/ui/checkbox"
import { PLATFORMS, useAuthors } from "@/lib/authors"
import type { Post } from "@/lib/posts"
import { formatDate } from "./post-helpers"
import { PlatformIcon } from "@/components/platform-icon"

function MetricHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1" title={label}>
      {icon}
      <span className="sr-only">{label}</span>
    </span>
  )
}

function MetricCell({ value }: { value: number }) {
  return <span className="tabular-nums text-muted-foreground">{value.toLocaleString()}</span>
}

interface PostsTableProps {
  posts: Post[]
  isPending: boolean
  showAuthor: boolean
  renderAction?: (post: Post) => React.ReactNode
  onSelectPost?: (post: Post) => void
  selectedIds?: Set<string>
  onToggleSelect?: (postId: string) => void
  onSelectAll?: (postIds: string[], checked: boolean) => void
}

export function PostsTable({
  posts,
  isPending,
  showAuthor,
  renderAction,
  onSelectPost,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}: PostsTableProps) {
  const { data: authors } = useAuthors()

  const authorName = (id: string) =>
    authors?.find((a) => a.id === id)?.name ?? "Unknown"

  const platformLabel = (key: string) =>
    PLATFORMS.find((p) => p.key === key)?.label ?? key

  const selectionEnabled = !!onToggleSelect
  const allSelected = posts.length > 0 && posts.every((p) => selectedIds?.has(p.id))
  const someSelected = posts.some((p) => selectedIds?.has(p.id))

  const columns: ColumnDef<Post>[] = [
    ...(selectionEnabled
      ? ([
          {
            id: "select",
            enableSorting: false,
            header: () => (
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                aria-label="Select all posts"
                onClick={(e) => e.stopPropagation()}
                onCheckedChange={(checked) =>
                  onSelectAll?.(posts.map((p) => p.id), checked === true)
                }
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={selectedIds?.has(row.original.id) ?? false}
                aria-label="Select post"
                onClick={(e) => e.stopPropagation()}
                onCheckedChange={() => onToggleSelect?.(row.original.id)}
              />
            ),
          },
        ] satisfies ColumnDef<Post>[])
      : []),
    ...(showAuthor
      ? ([
          {
            id: "author",
            header: "Author",
            accessorFn: (row) => authorName(row.authorId),
            cell: ({ getValue }) => (
              <span className="font-medium">{getValue<string>()}</span>
            ),
          },
        ] satisfies ColumnDef<Post>[])
      : []),
    {
      id: "platform",
      header: "Platform",
      accessorFn: (row) => platformLabel(row.platform),
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          <PlatformIcon platform={row.original.platform} className="size-4 shrink-0" />
          {platformLabel(row.original.platform)}
        </span>
      ),
    },
    {
      accessorKey: "text",
      header: "Content",
      cell: ({ getValue }) => (
        <span className="truncate block max-w-48">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap">{formatDate(getValue<string>())}</span>
      ),
    },
    {
      accessorKey: "likes",
      header: () => <MetricHeader icon={<Heart className="size-3.5" />} label="Likes" />,
      cell: ({ getValue }) => <MetricCell value={getValue<number>()} />,
    },
    {
      accessorKey: "views",
      header: () => <MetricHeader icon={<Eye className="size-3.5" />} label="Views" />,
      cell: ({ getValue }) => <MetricCell value={getValue<number>()} />,
    },
    {
      accessorKey: "comments",
      header: () => <MetricHeader icon={<MessageCircle className="size-3.5" />} label="Comments" />,
      cell: ({ getValue }) => <MetricCell value={getValue<number>()} />,
    },
    {
      accessorKey: "shares",
      header: () => <MetricHeader icon={<Forward className="size-3.5" />} label="Shares" />,
      cell: ({ getValue }) => <MetricCell value={getValue<number>()} />,
    },
    {
      id: "thumbnail",
      header: "Thumbnail",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.mediaUrl ? (
          <Image
            src={row.original.mediaUrl}
            alt=""
            width={48}
            height={36}
            className="rounded object-cover"
          />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    ...(renderAction
      ? ([
          {
            id: "actions",
            header: "",
            enableSorting: false,
            cell: ({ row }) => renderAction(row.original),
          },
        ] satisfies ColumnDef<Post>[])
      : []),
  ]

  return (
    <DataTable
      columns={columns}
      data={posts}
      isLoading={isPending}
      emptyMessage="No posts found."
      onRowClick={onSelectPost}
    />
  )
}
