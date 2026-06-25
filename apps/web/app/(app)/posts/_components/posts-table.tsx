"use client"

import Image from "next/image"
import React from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { Heart, MessageCircle, Eye } from "lucide-react"

import { DataTable } from "@/components/ui/data-table"
import { PLATFORMS, useAuthors } from "@/lib/authors"
import type { Post } from "@/lib/posts"
import { formatDate } from "./post-helpers"
import { PlatformIcon } from "@/components/platform-icon"

interface PostsTableProps {
  posts: Post[]
  isPending: boolean
  showAuthor: boolean
  renderAction?: (post: Post) => React.ReactNode
  onSelectPost?: (post: Post) => void
}

export function PostsTable({ posts, isPending, showAuthor, renderAction, onSelectPost }: PostsTableProps) {
  const { data: authors } = useAuthors()

  const authorName = (id: string) =>
    authors?.find((a) => a.id === id)?.name ?? "Unknown"

  const platformLabel = (key: string) =>
    PLATFORMS.find((p) => p.key === key)?.label ?? key

  const columns: ColumnDef<Post>[] = [
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
      id: "engagement",
      header: "Engagement",
      enableSorting: false,
      cell: ({ row }) => {
        const { likes, comments, views } = row.original.engagement
        return (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="size-3.5" />
              {likes.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="size-3.5" />
              {comments.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="size-3.5" />
              {views.toLocaleString()}
            </span>
          </div>
        )
      },
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
