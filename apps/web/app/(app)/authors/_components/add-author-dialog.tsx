"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
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
  useCreateAuthor,
  useUpdateAuthor,
  type Author,
  type PlatformKey,
  type SocialEntry,
} from "@/lib/authors"

// ponytail: shared refinement — reused across all five platform fields
const usernameField = z
  .string()
  .trim()
  .optional()
  .refine(
    (v) => !v || /^@?[A-Za-z0-9._-]+$/.test(v),
    { message: "Enter the username or channel name, not a URL" }
  )

const schema = z.object({
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

  const createMutation = useCreateAuthor()
  const updateMutation = useUpdateAuthor()
  const mutation = isEdit ? updateMutation : createMutation

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: isEdit ? authorToDefaults(author) : EMPTY_DEFAULTS,
  })

  // Re-populate form when the author prop changes (e.g. different row clicked)
  useEffect(() => {
    if (author) form.reset(authorToDefaults(author))
  }, [author?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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

    const input = { name: values.name, socials }

    if (isEdit) {
      updateMutation.mutate(
        { id: author.id, input },
        {
          onSuccess: () => {
            toast.success("Author updated")
            setOpen(false)
          },
        }
      )
    } else {
      createMutation.mutate(input, {
        onSuccess: () => {
          toast.success("Author added")
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
