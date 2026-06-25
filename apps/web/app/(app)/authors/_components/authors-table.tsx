"use client"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PLATFORMS, useAuthors } from "@/lib/authors"

export function AuthorsTable() {
  const { data: authors, isPending } = useAuthors()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Redes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isPending && (
          <TableRow>
            <TableCell colSpan={2}>
              <Skeleton className="h-4 w-48" />
            </TableCell>
          </TableRow>
        )}

        {!isPending && (!authors || authors.length === 0) && (
          <TableRow>
            <TableCell colSpan={2} className="text-center text-muted-foreground">
              Aún no hay autores. Añade el primero.
            </TableCell>
          </TableRow>
        )}

        {authors?.map((author) => (
          <TableRow key={author.id}>
            <TableCell className="font-medium">{author.name}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {PLATFORMS.filter((p) => author.socials[p.key]).map((p) => (
                  <Badge key={p.key} variant="secondary">
                    {p.label}
                  </Badge>
                ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
