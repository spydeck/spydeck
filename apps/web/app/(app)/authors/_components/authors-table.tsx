"use client"

import { useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { PLATFORMS, useAuthors, useDeleteAuthor, type Author } from "@/lib/authors"
import { PlatformIcon } from "@/components/platform-icon"
import { AddAuthorDialog } from "./add-author-dialog"

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
        cell: ({ getValue }) => {
          const v = getValue<string | null>()
          return v ?? <span className="text-muted-foreground">—</span>
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
