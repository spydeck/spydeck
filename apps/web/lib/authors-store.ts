// ponytail: localStorage mock — swappable in one place (see authors.ts TODO)
import type { Author, CreateAuthorInput } from "@/lib/authors"

const KEY = "authors_store"

function load(): Author[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Author[]
  } catch {
    return []
  }
}

function save(authors: Author[]) {
  localStorage.setItem(KEY, JSON.stringify(authors))
}

export const authorsStoreMock = {
  list: (): Promise<Author[]> => Promise.resolve(load()),
  create: (input: CreateAuthorInput): Promise<Author> => {
    const author: Author = { id: crypto.randomUUID(), ...input }
    save([...load(), author])
    return Promise.resolve(author)
  },
}
