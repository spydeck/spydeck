"use client"

import { useState } from "react"
import { BookmarkIcon, ChevronDownIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { NormalizedAd } from "../../search-ads/_components/normalized-ad"
import { useSavedAds } from "./use-saved-ads"
import { useSwipeCategories } from "./use-categories"

export function AddToSwipeButton({
  ads,
  onDone,
}: {
  ads: NormalizedAd[]
  onDone: () => void
}) {
  const { addAds } = useSavedAds()
  const { categories, createCategory } = useSwipeCategories()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [busy, setBusy] = useState(false)

  const count = ads.length
  const label = `${count} ad${count > 1 ? "s" : ""}`

  async function addToGeneral() {
    if (busy || count === 0) return
    setBusy(true)
    try {
      const cat = await createCategory({ name: "General" })
      await addAds(ads, cat?.id)
      toast.success(`Added ${label} to General`)
      onDone()
    } catch {
      toast.error("Failed to add to Swipe Ads")
    } finally {
      setBusy(false)
    }
  }

  async function confirmCategory() {
    const name = newName.trim()
    if (!selectedId && !name) return
    setBusy(true)
    try {
      const id = name ? (await createCategory({ name }))?.id : selectedId
      if (!id) throw new Error("no category")
      await addAds(ads, id)
      toast.success(`Added ${label} to ${name || categoryName(selectedId)}`)
      setDialogOpen(false)
      setNewName("")
      setSelectedId(null)
      onDone()
    } catch {
      toast.error("Failed to add to category")
    } finally {
      setBusy(false)
    }
  }

  function categoryName(id: string | null) {
    return categories.find((c) => c.id === id)?.name ?? "category"
  }

  return (
    <>
      <div className="inline-flex">
        <Button
          size="sm"
          className="rounded-r-none"
          disabled={busy}
          onClick={addToGeneral}
        >
          <BookmarkIcon data-icon="inline-start" />
          Add to Swipe Ads
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              aria-label="More add options"
              disabled={busy}
              className="rounded-l-none border-l border-primary-foreground/25 px-2"
            >
              <ChevronDownIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDialogOpen(true)}>
              Add to Category…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to category</DialogTitle>
            <DialogDescription>
              Choose a category for the selected {label}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {categories.length > 0 && (
              <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(c.id)
                      setNewName("")
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                      selectedId === c.id && "bg-muted ring-1 ring-primary"
                    )}
                  >
                    <span
                      className="size-3 shrink-0 rounded-full border"
                      style={c.color ? { backgroundColor: c.color } : undefined}
                    />
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <PlusIcon className="size-4 shrink-0 text-muted-foreground" />
              <Input
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value)
                  if (e.target.value) setSelectedId(null)
                }}
                placeholder="Or create a new category…"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmCategory}
              disabled={busy || (!selectedId && !newName.trim())}
            >
              Add {label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
