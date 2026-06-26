"use client"

import { useState } from "react"
import { PlusIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useCreateAdvertiser,
  type AdvertiserPlatform,
  type ChannelInput,
} from "@/lib/advertisers"
import { ChannelPicker } from "./channel-picker"
import { PlatformIcon } from "./platform-icon"

export function AddAdvertiserDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [channels, setChannels] = useState<ChannelInput[]>([])
  const create = useCreateAdvertiser()

  function reset() {
    setName("")
    setChannels([])
  }

  // One channel per platform; picking again replaces it.
  function addChannel(c: ChannelInput) {
    setChannels((prev) => [...prev.filter((x) => x.platform !== c.platform), c])
  }
  function removeChannel(p: AdvertiserPlatform) {
    setChannels((prev) => prev.filter((x) => x.platform !== p))
  }

  async function submit() {
    if (!name.trim()) return
    try {
      await create.mutateAsync({
        name: name.trim(),
        logo: channels.find((c) => c.logo)?.logo ?? null,
        channels,
      })
      toast.success(`Added ${name.trim()}`)
      reset()
      setOpen(false)
    } catch {
      toast.error("Failed to add advertiser")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          Add advertiser
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add advertiser</DialogTitle>
          <DialogDescription>
            Name the advertiser and attach its channels per platform.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="adv-name">Name</Label>
          <Input
            id="adv-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lusha"
          />
        </div>

        {channels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {channels.map((c) => (
              <Badge key={c.platform} variant="secondary" className="gap-1.5 font-normal">
                <PlatformIcon platform={c.platform} className="size-3.5" />
                <span className="max-w-[140px] truncate">{c.name}</span>
                <button
                  type="button"
                  aria-label="Remove channel"
                  onClick={() => removeChannel(c.platform)}
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="rounded-lg border p-3">
          <ChannelPicker onPick={addChannel} />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false)
              reset()
            }}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim() || create.isPending}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
