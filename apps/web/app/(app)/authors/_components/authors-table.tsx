"use client"

import { useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { BadgeCheck, Pencil, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

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
import {
  PLATFORMS,
  SYNC_REFRESH_DELAY_MS,
  useAuthors,
  useDeleteAuthor,
  useExtractProfile,
  type Author,
  type AuthorProfile,
  type PlatformKey,
} from "@/lib/authors"
import { PlatformIcon } from "@/components/platform-icon"
import { AddAuthorDialog } from "./add-author-dialog"

const EXTRACTABLE: ReadonlySet<PlatformKey> = new Set(["instagram", "tiktok", "youtube", "x"])

function SyncButton({ author }: { author: Author }) {
  const [syncing, setSyncing] = useState(false)
  const { mutate } = useExtractProfile()
  const queryClient = useQueryClient()

  function handleSync() {
    const platforms = (Object.entries(author.socials) as [PlatformKey, { value: string }][])
      .filter(([p, s]) => EXTRACTABLE.has(p) && !!s.value)
      .map(([p]) => p)

    if (platforms.length === 0) {
      toast.error("No profiles to sync")
      return
    }

    toast.info("Syncing profiles…")
    setSyncing(true)

    for (const platform of platforms) {
      mutate({ id: author.id, platform })
    }

    // ponytail: spinner reset is timed, not tied to real job completion —
    // extraction is async/queued with no per-job callback available here
    setTimeout(() => {
      setSyncing(false)
      queryClient.invalidateQueries({ queryKey: ["authors"] })
    }, SYNC_REFRESH_DELAY_MS)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Sync ${author.name}`}
      title="Sync profiles"
      disabled={syncing}
      onClick={handleSync}
    >
      <RefreshCw className={syncing ? "animate-spin" : undefined} />
    </Button>
  )
}

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
            <div className="flex items-center gap-2">
              <Avatar className="size-7 shrink-0">
                <AvatarImage src={profile.avatarUrl ?? undefined} alt={label ?? undefined} />
                <AvatarFallback className="text-[10px]">{fallback}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="flex items-center gap-1 text-sm font-medium">
                  <span className="truncate">{label}</span>
                  {profile.verified && (
                    <BadgeCheck className="size-3.5 shrink-0 text-blue-500" aria-label="Verified" />
                  )}
                </span>
                {count && (
                  <span className="text-xs text-muted-foreground">{count} followers</span>
                )}
              </div>
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
            <SyncButton author={author} />
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
