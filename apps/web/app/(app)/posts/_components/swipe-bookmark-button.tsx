"use client"

import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSwipeFileIds, useToggleSwipeFile } from "@/lib/swipe-files"
import { cn } from "@/lib/utils"

interface SwipeBookmarkButtonProps {
  postId: string
}

export function SwipeBookmarkButton({ postId }: SwipeBookmarkButtonProps) {
  const { data: savedIds } = useSwipeFileIds()
  const { mutate: toggle, isPending } = useToggleSwipeFile()

  const isSaved = savedIds?.includes(postId) ?? false

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isSaved ? "Remove from swipe files" : "Save to swipe files"}
      disabled={isPending}
      onClick={(e) => {
        e.stopPropagation()
        toggle({ postId, saved: isSaved })
      }}
      className="size-8"
    >
      <Bookmark
        className={cn("size-4 text-red-500", isSaved && "fill-current")}
      />
    </Button>
  )
}
