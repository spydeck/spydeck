"use client"

import { useState } from "react"
import { TagIcon } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { useSavedAds } from "./use-saved-ads"
import { useSwipeCategories } from "./use-categories"

// `selected` is either a category id, "none" (uncategorized) or null (nothing picked).
export function ChangeCategoryButton({
  adIds,
  onDone,
}: {
  adIds: string[]
  onDone: () => void
}) {
  const { categories, createCategory } = useSwipeCategories()
  const { setCategory } = useSavedAds()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [busy, setBusy] = useState(false)

  const count = adIds.length
  const label = `${count} ad${count > 1 ? "s" : ""}`

  async function confirm() {
    const name = newName.trim()
    if (!selected && !name) return
    setBusy(true)
    try {
      let categoryId: string | null
      if (name) categoryId = (await createCategory({ name }))?.id ?? null
      else categoryId = selected === "none" ? null : selected
      await setCategory(adIds, categoryId)
      toast.success(`Updated category for ${label}`)
      setOpen(false)
      setNewName("")
      setSelected(null)
      onDone()
    } catch {
      toast.error("Failed to update category")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <TagIcon data-icon="inline-start" />
        Change category
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change category</DialogTitle>
            <DialogDescription>Set the category for {label}.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setSelected("none")
                  setNewName("")
                }}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                  selected === "none" && "bg-muted ring-1 ring-primary"
                )}
              >
                <span className="size-3 shrink-0 rounded-full border" />
                Uncategorized
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelected(c.id)
                    setNewName("")
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                    selected === c.id && "bg-muted ring-1 ring-primary"
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

            <Input
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value)
                if (e.target.value) setSelected(null)
              }}
              placeholder="Or create a new category…"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirm}
              disabled={busy || (!selected && !newName.trim())}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
