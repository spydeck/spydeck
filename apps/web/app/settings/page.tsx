"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const schema = z.object({
  scrapeCreatorsKey: z.string().trim(),
  apifyKey: z.string().trim(),
  resendKey: z.string().trim(),
})

type FormValues = z.infer<typeof schema>

function SecretInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  id?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex gap-2">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="font-mono"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide key" : "Show key"}
      >
        {show ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  )
}

export default function SettingsPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      scrapeCreatorsKey: "",
      apifyKey: "",
      resendKey: "",
    },
  })

  function onSubmit(values: FormValues) {
    // TODO: wire to backend
    console.log("API keys to save:", values)
    toast.success("Settings saved")
  }

  return (
    <div className="flex flex-1 flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your third-party API keys.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Keys are stored securely and used to connect external services.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <FormField
                  control={form.control}
                  name="scrapeCreatorsKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ScrapeCreators API Key</FormLabel>
                      <FormControl>
                        <SecretInput
                          id={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="sc_••••••••"
                        />
                      </FormControl>
                      <FormDescription>
                        Find your key at{" "}
                        <a
                          href="https://scrapecreators.com/dashboard"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-4"
                        >
                          scrapecreators.com/dashboard
                        </a>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apifyKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apify API Key</FormLabel>
                      <FormControl>
                        <SecretInput
                          id={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="apify_api_••••••••"
                        />
                      </FormControl>
                      <FormDescription>
                        Find your key under Settings → Integrations at{" "}
                        <a
                          href="https://console.apify.com/settings/integrations"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-4"
                        >
                          console.apify.com
                        </a>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resendKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resend API Key</FormLabel>
                      <FormControl>
                        <SecretInput
                          id={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="re_••••••••"
                        />
                      </FormControl>
                      <FormDescription>
                        Find your key at{" "}
                        <a
                          href="https://resend.com/api-keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-4"
                        >
                          resend.com/api-keys
                        </a>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  Save keys
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  )
}
