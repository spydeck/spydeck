/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server bundle for Docker (.next/standalone)
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      // Social media CDNs for synced post/profile media. next/image's optimizer
      // fetches these server-side, so the browser loads them same-origin (no CORP block).
      // ponytail: these CDN URLs expire — fine for freshly synced posts; re-sync to refresh.
      { protocol: "https", hostname: "**.cdninstagram.com" }, // Instagram
      { protocol: "https", hostname: "**.fbcdn.net" }, // Instagram/Facebook
      { protocol: "https", hostname: "**.tiktokcdn.com" }, // TikTok
      { protocol: "https", hostname: "**.tiktokcdn-us.com" }, // TikTok (US)
      { protocol: "https", hostname: "**.tiktokcdn-eu.com" }, // TikTok (EU)
      { protocol: "https", hostname: "i.ytimg.com" }, // YouTube thumbnails
      { protocol: "https", hostname: "**.ggpht.com" }, // YouTube avatars/thumbnails
      { protocol: "https", hostname: "pbs.twimg.com" }, // Twitter/X media
    ],
  },
}

export default nextConfig
