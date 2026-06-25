// ponytail: localStorage mock — swappable in one place (see posts.ts TODO)
import type { Post, PostStatus } from "@/lib/posts"
import type { Author, PlatformKey } from "@/lib/authors"
import { PLATFORMS } from "@/lib/authors"

const KEY = "posts_store"
const AUTHORS_KEY = "authors_store"

function load(): Post[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Post[]
  } catch {
    return []
  }
}

function save(posts: Post[]) {
  localStorage.setItem(KEY, JSON.stringify(posts))
}

function loadAuthors(): Author[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(AUTHORS_KEY) ?? "[]") as Author[]
  } catch {
    return []
  }
}

const SAMPLE_TEXTS = [
  "Just dropped our latest collection — swipe to see all the looks! ✨",
  "Behind the scenes from yesterday's shoot. The team crushed it.",
  "Big announcement coming this Friday. Stay tuned.",
  "Throwback to one of our most successful campaigns. Lessons learned:",
  "Q&A time! Drop your questions below and I'll answer the best ones.",
  "Here's what we've been working on for the past 3 months...",
  "The numbers are in — and we're blown away by your support.",
  "New partnership alert! So excited to share this with you all.",
]

const SAMPLE_STATUSES: PostStatus[] = ["published", "published", "scheduled", "draft"]

function seedPostsForAuthor(author: Author, existingIds: Set<string>): Post[] {
  const platformKeys = Object.keys(author.socials ?? {}) as PlatformKey[]
  const platforms: PlatformKey[] =
    platformKeys.length > 0 ? platformKeys : (PLATFORMS.map((p) => p.key) as PlatformKey[])

  const now = Date.now()
  const posts: Post[] = []

  for (let i = 0; i < 4; i++) {
    const id = `${author.id}-post-${i}`
    if (existingIds.has(id)) continue

    const platform = platforms[i % platforms.length] as PlatformKey
    const daysAgo = i * 5 + 1
    const date = new Date(now - daysAgo * 86400 * 1000).toISOString()
    const status = SAMPLE_STATUSES[i % SAMPLE_STATUSES.length] as PostStatus
    const text =
      SAMPLE_TEXTS[(i + author.id.charCodeAt(0)) % SAMPLE_TEXTS.length] ??
      SAMPLE_TEXTS[0]!

    posts.push({
      id,
      authorId: author.id,
      platform,
      text,
      mediaUrl: `https://picsum.photos/seed/${id}/400/300`,
      status,
      date,
      engagement: {
        likes: Math.floor(Math.random() * 2000) + 50,
        comments: Math.floor(Math.random() * 200) + 5,
        views: Math.floor(Math.random() * 20000) + 500,
        shares: Math.floor(Math.random() * 500) + 1,
      },
    })
  }

  return posts
}

export const postsStoreMock = {
  list: (authorId?: string): Promise<Post[]> => {
    const authors = loadAuthors()
    if (authors.length === 0) return Promise.resolve([])

    let posts = load()
    const existingAuthorIds = new Set(posts.map((p) => p.authorId))

    // Top-up: seed posts for any author that has none yet
    let dirty = false
    for (const author of authors) {
      if (!existingAuthorIds.has(author.id)) {
        const existingIds = new Set(posts.map((p) => p.id))
        const seeded = seedPostsForAuthor(author, existingIds)
        if (seeded.length > 0) {
          posts = [...posts, ...seeded]
          dirty = true
        }
      }
    }

    if (dirty) save(posts)

    const filtered = authorId ? posts.filter((p) => p.authorId === authorId) : posts
    return Promise.resolve(filtered.slice().sort((a, b) => b.date.localeCompare(a.date)))
  },
}
