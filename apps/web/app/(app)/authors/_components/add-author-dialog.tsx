"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  PLATFORMS,
  SYNC_REFRESH_DELAY_MS,
  platformsToSync,
  useCreateAuthor,
  useExtractProfile,
  useUpdateAuthor,
  type Author,
  type PlatformKey,
  type SocialEntry,
} from "@/lib/authors"
import { useQueryClient } from "@tanstack/react-query"

// Platforms that support initial-sync scope selection (no facebook)
const EXTRACTABLE: ReadonlySet<PlatformKey> = new Set(["instagram", "tiktok", "youtube", "x"])

type SyncMode = "full" | "count" | "range"

// ponytail: shared refinement — reused across all five platform fields
const usernameField = z
  .string()
  .trim()
  .optional()
  .refine(
    (v) => !v || /^@?[A-Za-z0-9._-]+$/.test(v),
    { message: "Enter the username or channel name, not a URL" }
  )

// Per-extractable-platform sync-scope fields
// ponytail: no .default(); no constraints here — all conditional validation lives in superRefine
const syncScopeFields = {
  instagramSyncMode:  z.enum(["full", "count", "range"]),
  instagramSyncCount: z.number().optional(),
  instagramSyncFrom:  z.string().optional(),
  instagramSyncTo:    z.string().optional(),
  tiktokSyncMode:     z.enum(["full", "count", "range"]),
  tiktokSyncCount:    z.number().optional(),
  tiktokSyncFrom:     z.string().optional(),
  tiktokSyncTo:       z.string().optional(),
  youtubeSyncMode:    z.enum(["full", "count", "range"]),
  youtubeSyncCount:   z.number().optional(),
  youtubeSyncFrom:    z.string().optional(),
  youtubeSyncTo:      z.string().optional(),
  xSyncMode:          z.enum(["full", "count", "range"]),
  xSyncCount:         z.number().optional(),
  xSyncFrom:          z.string().optional(),
  xSyncTo:            z.string().optional(),
} as const

const schema = z
  .object({
    name:          z.string().trim().min(1, "Name is required"),
    instagram:     usernameField,
    instagramSync: z.boolean(),
    tiktok:        usernameField,
    tiktokSync:    z.boolean(),
    youtube:       usernameField,
    youtubeSync:   z.boolean(),
    x:             usernameField,
    xSync:         z.boolean(),
    facebook:      usernameField,
    facebookSync:  z.boolean(),
    ...syncScopeFields,
  })
  .superRefine((data, ctx) => {
    // Validate sync-scope fields only for visible selectors.
    // The selector is visible when: extractable platform, sync ON, value present.
    // (We don't have author.profiles here — initial-sync check is done at render time;
    //  for validation we validate whenever the scope fields are non-default,
    //  which only happens when the selector is visible.)
    for (const p of ["instagram", "tiktok", "youtube", "x"] as const) {
      const syncOn = data[`${p}Sync` as `${typeof p}Sync`] as boolean
      const hasValue = !!(data[p as PlatformKey] as string | undefined)?.trim()
      if (!syncOn || !hasValue) continue

      const mode = data[`${p}SyncMode` as `${typeof p}SyncMode`] as SyncMode
      if (mode === "count") {
        const count = data[`${p}SyncCount` as `${typeof p}SyncCount`] as number | undefined
        if (!count || !Number.isInteger(count) || count < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [`${p}SyncCount`],
            message: "Enter a whole number of at least 1",
          })
        }
      } else if (mode === "range") {
        const from = (data[`${p}SyncFrom` as `${typeof p}SyncFrom`] as string | undefined) ?? ""
        const to   = (data[`${p}SyncTo`   as `${typeof p}SyncTo`]   as string | undefined) ?? ""
        if (!from) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [`${p}SyncFrom`], message: "From date is required" })
        }
        if (!to) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [`${p}SyncTo`], message: "To date is required" })
        }
        if (from && to && from > to) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [`${p}SyncFrom`], message: "From must be before To" })
        }
      }
    }
  })

type FormValues = z.infer<typeof schema>
type SyncKey = `${PlatformKey}Sync`

const EMPTY_DEFAULTS: FormValues = {
  name: "",
  instagram: "", instagramSync: false,
  tiktok: "",    tiktokSync: false,
  youtube: "",   youtubeSync: false,
  x: "",         xSync: false,
  facebook: "",  facebookSync: false,
  // sync scope defaults
  instagramSyncMode: "full", instagramSyncCount: undefined, instagramSyncFrom: undefined, instagramSyncTo: undefined,
  tiktokSyncMode:    "full", tiktokSyncCount:    undefined, tiktokSyncFrom:    undefined, tiktokSyncTo:    undefined,
  youtubeSyncMode:   "full", youtubeSyncCount:   undefined, youtubeSyncFrom:   undefined, youtubeSyncTo:   undefined,
  xSyncMode:         "full", xSyncCount:         undefined, xSyncFrom:         undefined, xSyncTo:         undefined,
}

function authorToDefaults(author: Author): FormValues {
  const values: FormValues = { ...EMPTY_DEFAULTS, name: author.name }
  for (const p of PLATFORMS) {
    const entry = author.socials[p.key]
    ;(values as Record<string, unknown>)[p.key] = entry?.value ?? ""
    ;(values as Record<string, unknown>)[`${p.key}Sync`] = entry?.synchronize ?? false
  }
  return values
}

// Shape of the captured initial-sync selection (not sent to backend yet)
export type InitialSyncScope = Partial<Record<PlatformKey, { mode: SyncMode; count?: number; from?: string; to?: string }>>

interface AddAuthorDialogProps {
  /** When provided, operates in edit mode. */
  author?: Author
  /** Controlled open state (required in edit mode). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddAuthorDialog({ author, open: controlledOpen, onOpenChange }: AddAuthorDialogProps) {
  const isEdit = !!author
  const [internalOpen, setInternalOpen] = useState(false)

  // Uncontrolled (create) vs controlled (edit)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const qc = useQueryClient()
  const createMutation = useCreateAuthor()
  const updateMutation = useUpdateAuthor()
  const extractProfile = useExtractProfile()
  const mutation = isEdit ? updateMutation : createMutation

  function fireExtractions(id: string, socials: Partial<Record<PlatformKey, SocialEntry>>, prevSocials?: Partial<Record<PlatformKey, SocialEntry>>) {
    const platforms = platformsToSync(socials, prevSocials)
    if (platforms.length === 0) return
    toast.info("Syncing profile…")
    for (const platform of platforms) {
      extractProfile.mutate({ id, platform })
    }
    setTimeout(() => qc.invalidateQueries({ queryKey: ["authors"] }), SYNC_REFRESH_DELAY_MS)
  }

  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: isEdit ? authorToDefaults(author) : EMPTY_DEFAULTS,
  })

  // Watch fields needed for conditional scope-selector visibility
  const watched = form.watch()

  // Re-populate form when the author prop changes (e.g. different row clicked)
  useEffect(() => {
    if (author) form.reset(authorToDefaults(author))
  }, [author?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Returns true when the initial-sync scope selector should be shown for a platform */
  function showScopeSelector(platformKey: PlatformKey): boolean {
    if (!EXTRACTABLE.has(platformKey)) return false
    const value   = (watched[platformKey as keyof FormValues] as string | undefined) ?? ""
    const syncOn  = watched[`${platformKey}Sync` as SyncKey] as boolean
    if (!syncOn || !value.trim()) return false
    // In edit mode: only show for platforms NOT already in author.profiles
    if (isEdit && author) {
      const alreadySynced = author.profiles.some((p) => p.platform === platformKey)
      if (alreadySynced) return false
    }
    return true
  }

  function onSubmit(values: FormValues) {
    const socials = Object.fromEntries(
      PLATFORMS
        .filter((p) => values[p.key as PlatformKey])
        .map((p) => [
          p.key,
          {
            value: values[p.key as PlatformKey]!,
            synchronize: values[`${p.key}Sync` as SyncKey],
          } satisfies SocialEntry,
        ])
    ) as Partial<Record<PlatformKey, SocialEntry>>

    // Capture initial-sync scope selections (not sent to backend yet)
    const initialSync: InitialSyncScope = {}
    for (const p of ["instagram", "tiktok", "youtube", "x"] as const) {
      if (!showScopeSelector(p)) continue
      const mode = values[`${p}SyncMode` as `${typeof p}SyncMode`] as SyncMode
      initialSync[p] = { mode }
      if (mode === "count") initialSync[p]!.count = values[`${p}SyncCount` as `${typeof p}SyncCount`] as number
      if (mode === "range") {
        initialSync[p]!.from = values[`${p}SyncFrom` as `${typeof p}SyncFrom`] as string
        initialSync[p]!.to   = values[`${p}SyncTo`   as `${typeof p}SyncTo`]   as string
      }
    }
    // TODO(backend): forward initialSync to the sync trigger once the API supports per-platform scope
    console.debug("initialSync", initialSync)

    const input = { name: values.name, socials }

    if (isEdit) {
      updateMutation.mutate(
        { id: author.id, input },
        {
          onSuccess: () => {
            toast.success("Author updated")
            fireExtractions(author.id, socials, author.socials)
            setOpen(false)
          },
        }
      )
    } else {
      createMutation.mutate(input, {
        onSuccess: (data) => {
          toast.success("Author added")
          fireExtractions(data.id, socials)
          form.reset(EMPTY_DEFAULTS)
          setOpen(false)
        },
      })
    }
  }

  const formBody = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Author name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <p className="text-sm font-medium">Social networks</p>

        {PLATFORMS.map((platform) => (
          <div key={platform.key} className="flex flex-col gap-2">
            <FormField
              control={form.control}
              name={platform.key as PlatformKey}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{platform.label}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={platform.placeholder}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        // Auto-enable sync as soon as the user enters a value
                        if (e.target.value.trim()) {
                          form.setValue(`${platform.key}Sync` as SyncKey, true, {
                            shouldDirty: true,
                          })
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${platform.key}Sync` as SyncKey}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="mt-0! font-normal text-muted-foreground">
                    Synchronize
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* Initial-sync scope selector — only for extractable platforms on first sync */}
            {showScopeSelector(platform.key as PlatformKey) && (
              <InitialSyncScopeSelector form={form} platformKey={platform.key as PlatformKey} watched={watched} />
            )}
          </div>
        ))}

        <Button type="submit" disabled={mutation.isPending} className="mt-2">
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Save"}
        </Button>
      </form>
    </Form>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button>Add author</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit author" : "Add author"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the author's name and social media accounts."
              : "Add an author and their social media accounts."}
          </DialogDescription>
        </DialogHeader>
        {formBody}
      </DialogContent>
    </Dialog>
  )
}

// ponytail: extracted to keep per-platform JSX flat; shares form instance via prop
function InitialSyncScopeSelector({
  form,
  platformKey,
  watched,
}: {
  form: ReturnType<typeof useForm<FormValues, unknown, FormValues>>
  platformKey: PlatformKey
  watched: FormValues
}) {
  const p = platformKey
  const modeField = `${p}SyncMode`  as `${typeof p}SyncMode`
  const countField = `${p}SyncCount` as `${typeof p}SyncCount`
  const fromField  = `${p}SyncFrom`  as `${typeof p}SyncFrom`
  const toField    = `${p}SyncTo`    as `${typeof p}SyncTo`

  const mode = (watched[modeField as keyof FormValues] as SyncMode) ?? "full"

  return (
    <div className="ml-1 flex flex-col gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">Initial sync scope</p>

      <FormField
        control={form.control}
        name={modeField as keyof FormValues}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <ToggleGroup
                type="single"
                size="sm"
                variant="outline"
                spacing={0}
                value={field.value as string}
                onValueChange={(v) => { if (v) field.onChange(v) }}
              >
                <ToggleGroupItem value="full">Full sync</ToggleGroupItem>
                <ToggleGroupItem value="count">Last N posts</ToggleGroupItem>
                <ToggleGroupItem value="range">Date range</ToggleGroupItem>
              </ToggleGroup>
            </FormControl>
          </FormItem>
        )}
      />

      {mode === "count" && (
        <FormField
          control={form.control}
          name={countField as keyof FormValues}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Number of posts</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="30"
                  className="w-28"
                  value={(field.value as number | undefined) ?? ""}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {mode === "range" && (
        <div className="flex flex-row gap-2">
          <FormField
            control={form.control}
            name={fromField as keyof FormValues}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-xs">From</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value as string | undefined}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={toField as keyof FormValues}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-xs">To</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value as string | undefined}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  )
}
