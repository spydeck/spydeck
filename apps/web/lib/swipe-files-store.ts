// ponytail: localStorage mock — swappable in one place (see swipe-files.ts TODO)
import type { Post } from "@/lib/posts"
import { postsStoreMock } from "@/lib/posts-store"

const KEY = "swipe_files_store"

function load(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]
  } catch {
    return []
  }
}

function save(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids))
}

export const swipeFilesStoreMock = {
  listIds: (): Promise<string[]> => Promise.resolve(load()),

  add: (id: string): Promise<void> => {
    const ids = load()
    if (!ids.includes(id)) save([...ids, id])
    return Promise.resolve()
  },

  remove: (id: string): Promise<void> => {
    save(load().filter((i) => i !== id))
    return Promise.resolve()
  },

  toggle: (id: string): Promise<void> => {
    const ids = load()
    save(ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id])
    return Promise.resolve()
  },

  list: async (authorId?: string): Promise<Post[]> => {
    const ids = load()
    if (ids.length === 0) return []
    const savedSet = new Set(ids)
    const posts = await postsStoreMock.list(authorId)
    // Drop ids whose post no longer exists; preserve date-desc order from postsStoreMock
    return posts.filter((p) => savedSet.has(p.id))
  },
}
