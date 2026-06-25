"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { PLATFORMS, useCreateAuthor, type PlatformKey } from "@/lib/authors"

const schema = z.object({
  name:      z.string().trim().min(1, "El nombre es obligatorio"),
  instagram: z.string().trim().optional(),
  tiktok:    z.string().trim().optional(),
  youtube:   z.string().trim().optional(),
  x:         z.string().trim().optional(),
  facebook:  z.string().trim().optional(),
})

type FormValues = z.infer<typeof schema>

export function AddAuthorDialog() {
  const [open, setOpen] = useState(false)
  const mutation = useCreateAuthor()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", instagram: "", tiktok: "", youtube: "", x: "", facebook: "" },
  })

  function onSubmit(values: FormValues) {
    const socials = Object.fromEntries(
      PLATFORMS
        .filter((p) => values[p.key as PlatformKey])
        .map((p) => [p.key, values[p.key as PlatformKey]])
    ) as Partial<Record<PlatformKey, string>>

    mutation.mutate(
      { name: values.name, socials },
      {
        onSuccess: () => {
          toast.success("Autor añadido")
          form.reset()
          setOpen(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add author</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add author</DialogTitle>
          <DialogDescription>
            Añade un autor y sus cuentas en redes sociales.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del autor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-sm font-medium">Redes sociales</p>

            {PLATFORMS.map((platform) => (
              <FormField
                key={platform.key}
                control={form.control}
                name={platform.key as PlatformKey}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{platform.label}</FormLabel>
                    <FormControl>
                      <Input placeholder={platform.placeholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <Button type="submit" disabled={mutation.isPending} className="mt-2">
              {mutation.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
