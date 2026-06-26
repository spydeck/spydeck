"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { format, parseISO } from "date-fns"
import { PlusIcon, Trash2Icon, XIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DataTable } from "@/components/ui/data-table"
import {
  useAddChannel,
  useAdvertisers,
  useDeleteAdvertiser,
  useRemoveChannel,
  type Advertiser,
} from "@/lib/advertisers"
import { ChannelPicker } from "./channel-picker"
import { PlatformIcon } from "./platform-icon"

export function AdvertisersTable() {
  const { data, isPending } = useAdvertisers()
  const removeAdvertiser = useDeleteAdvertiser()
  const addChannel = useAddChannel()
  const removeChannel = useRemoveChannel()

  const columns = useMemo<ColumnDef<Advertiser>[]>(
    () => [
      {
        id: "advertiser",
        accessorFn: (a) => a.name,
        header: "Advertiser",
        cell: ({ row }) => {
          const a = row.original
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-8 rounded-md">
                {a.logo && <AvatarImage src={a.logo} alt={a.name} />}
                <AvatarFallback className="rounded-md bg-muted text-xs font-semibold">
                  {a.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{a.name}</span>
            </div>
          )
        },
      },
      {
        id: "channels",
        enableSorting: false,
        header: "Channels",
        cell: ({ row }) => {
          const a = row.original
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              {a.channels.map((ch) => (
                <Badge key={ch.id} variant="secondary" className="gap-1.5 font-normal">
                  <PlatformIcon platform={ch.platform} className="size-3.5" />
                  <span className="max-w-[160px] truncate">{ch.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${ch.platform} channel`}
                    onClick={() =>
                      removeChannel.mutate({
                        advertiserId: a.id,
                        channelId: ch.id,
                      })
                    }
                  >
                    <XIcon className="size-3" />
                  </button>
                </Badge>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 gap-1 px-2">
                    <PlusIcon className="size-3.5" />
                    Add channel
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <ChannelPicker
                    onPick={(channel) =>
                      addChannel.mutate({ advertiserId: a.id, channel })
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          )
        },
      },
      {
        id: "createdAt",
        accessorFn: (a) => a.createdAt,
        size: 130,
        header: "Added",
        cell: ({ row }) => {
          const d = parseISO(row.original.createdAt)
          return (
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              {isNaN(d.getTime()) ? "–" : format(d, "dd/MM/yyyy")}
            </span>
          )
        },
      },
      {
        id: "actions",
        enableSorting: false,
        header: () => null,
        cell: ({ row }) => (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${row.original.name}`}
                className="size-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove advertiser?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes {row.original.name} and all its channels.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => removeAdvertiser.mutate(row.original.id)}
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ),
      },
    ],
    [addChannel, removeChannel, removeAdvertiser]
  )

  return (
    <DataTable
      columns={columns}
      data={data ?? []}
      isLoading={isPending}
      emptyMessage="No advertisers yet. Add one to start tracking."
    />
  )
}
