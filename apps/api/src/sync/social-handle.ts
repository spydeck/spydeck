import type { Params } from '../scrapecreators/scrapecreators.client';

// A social handle is a username / channel name, optionally @-prefixed — never a
// URL. URLs contain ':' or '/' (and possibly whitespace), all excluded here.
export const USERNAME_RE = /^@?[A-Za-z0-9._-]+$/;

/** True when `value` is a bare username/channel name and not a URL. */
export function isUsername(value: string): boolean {
  return USERNAME_RE.test((value ?? '').trim());
}

/**
 * Bare handle for the Instagram / TikTok / X profile endpoints.
 * Strips an optional leading @ (e.g. "@jane" -> "jane").
 */
export function normalizeHandle(raw: string): string {
  return (raw ?? '').trim().replace(/^@+/, '');
}

/**
 * YouTube's /channel endpoint takes channelId | handle in dedicated params.
 *   UCxxxxxxxxxxxxxxxxxxxxxx -> { channelId: ... }
 *   nateherk / @nateherk     -> { handle: '@nateherk' }
 */
export function youtubeProfileParams(raw: string): Params {
  const v = (raw ?? '').trim();
  if (/^UC[\w-]{20,}$/.test(v)) return { channelId: v };
  return { handle: v.startsWith('@') ? v : `@${v}` };
}
