"use client"

import { useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTable } from "@/components/ui/data-table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PLATFORMS, useAuthors, useDeleteAuthor, type Author, type AuthorProfile } from "@/lib/authors"
import { PlatformIcon } from "@/components/platform-icon"
import { AddAuthorDialog } from "./add-author-dialog"

function profileFor(author: Author, platform: string): AuthorProfile | undefined {
  return author.profiles?.find((p) => p.platform === platform)
}

const compactFormatter = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
function formatCount(n: number | null | undefined): string | null {
  return n != null ? compactFormatter.format(n) : null
}

function getAuthorColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (author: Author) => void
  onDelete: (author: Author) => void
}): ColumnDef<Author>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>()}</span>
      ),
    },
    ...PLATFORMS.map(
      (p): ColumnDef<Author> => ({
        id: p.key,
        header: () => (
          <span className="flex items-center gap-1.5">
            <PlatformIcon platform={p.key} className="size-4" />
            {p.label}
          </span>
        ),
        accessorFn: (row) => row.socials[p.key]?.value ?? null,
        cell: ({ row, getValue }) => {
          const handle = getValue<string | null>()
          // ponytail: facebook has no extract-profile endpoint, skip profile lookup
          const profile = p.key !== "facebook" ? profileFor(row.original, p.key) : undefined
          if (!profile) return handle ?? <span className="text-muted-foreground">—</span>
          const label = profile.displayName ?? profile.handle ?? handle
          const fallback = (label ?? "?")[0]!.toUpperCase()
          const count = formatCount(profile.followerCount)
          return (
            <div className="flex items-center gap-1.5">
              <Avatar className="size-6 shrink-0">
                <AvatarImage src={profile.avatarUrl ?? undefined} alt={label ?? undefined} />
                <AvatarFallback className="text-[10px]">{fallback}</AvatarFallback>
              </Avatar>
              <span className="truncate text-sm">{label}</span>
              {profile.verified && (
                <BadgeCheck className="size-3.5 shrink-0 text-blue-500" aria-label="Verified" />
              )}
              {count && (
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">{count}</span>
              )}
            </div>
          )
        },
      })
    ),
    {
      id: "actions",
      enableSorting: false,
      header: () => null,
      cell: ({ row }) => {
        const author = row.original
        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${author.name}`}
              onClick={() => onEdit(author)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${author.name}`}
              onClick={() => onDelete(author)}
            >
              <Trash2 />
            </Button>
          </div>
        )
      },
    },
  ]
}

export function AuthorsTable() {
  const { data: authors, isPending } = useAuthors()
  const deleteMutation = useDeleteAuthor()

  const [editAuthor, setEditAuthor] = useState<Author | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Author | null>(null)

  const columns = getAuthorColumns({
    onEdit: setEditAuthor,
    onDelete: setDeleteTarget,
  })

  return (
    <>
      <DataTable
        columns={columns}
        data={authors ?? []}
        isLoading={isPending}
        emptyMessage="No authors yet. Add your first one."
      />

      {editAuthor && (
        <AddAuthorDialog
          author={editAuthor}
          open={!!editAuthor}
          onOpenChange={(o) => { if (!o) setEditAuthor(null) }}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete author</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) return
                deleteMutation.mutate(deleteTarget.id, {
                  onSuccess: () => toast.success("Author deleted"),
                })
                setDeleteTarget(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
