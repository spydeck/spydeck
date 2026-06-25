"use client"

import { SiteHeader } from "@/components/site-header"
import { AddAuthorDialog } from "./_components/add-author-dialog"
import { AuthorsTable } from "./_components/authors-table"

export default function AuthorsPage() {
  return (
    <>
      <SiteHeader title="Authors" />
      <div className="flex flex-1 flex-col gap-6 px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Authors</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los autores y sus cuentas en redes sociales.
            </p>
          </div>
          <AddAuthorDialog />
        </div>
        <AuthorsTable />
      </div>
    </>
  )
}
