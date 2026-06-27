# Spydeck

[![Backend Tests](https://github.com/spydeck/spydeck/actions/workflows/test-backend.yml/badge.svg)](https://github.com/spydeck/spydeck/actions/workflows/test-backend.yml)

A powerful self-hosted swipe file and ad database for creators, marketers, and researchers. Point it at any creator's handle across TikTok, Instagram, YouTube, or X to automatically sync their recent posts, analyze their top performers, and build a structured visual repository of what works.

---

## Why Spydeck?

Enterprise creator tracking and ad library tools like **Favikon** or **Modash** can be prohibitively expensive, with subscriptions ranging between **€100 to €200/month**.

Spydeck is designed as a cost-effective, self-hosted alternative that can be run for a fraction of that cost:
* **Hosting:** Run it on a budget cloud provider like Hetzner (approx. **€20/month**).
* **Creator Data:** Uses the **ScrapeCreators API** (free tier includes 1,000 credits; paid tier is €43 for 25,000 credits).
* **Ad Data:** Integrates with **Apify** (utilizing their free $10/month tier).
* **Total Cost:** Under **€30 to €60/month** for a private, dedicated system that you own and run without user seat caps or pricing tiers.

---

## Visual Overview

### Track and Organize Content Creators
Monitor creators, platforms, and high-level engagement performance at a glance.
![Track Creators](./screenshots/authors_page.png)

### Deep Post Analysis & Metrics Explorer
Filter, sort, and search synced posts by engagement rates, date, or likes. View captions, inline media, and detailed engagement analytics in a responsive side panel.
![Analyze Posts](./screenshots/author_posts.png)

### Universal Ad Creative Library
Search, track, and save active advertising creatives and company profiles across major networks (Meta, LinkedIn, Google).
![Browse Ad Libraries](./screenshots/search_ads.png)
![Ad Library Search](./screenshots/search_ads_table.png)

---

## Key Features

* **Multi-Platform Sync:** Automatically fetch recent posts from TikTok, Instagram, YouTube, and X for any tracked handle.
* **Granular Filters & Sorting:** Discover top-performing content by sorting by likes, comments, views, shares, and engagement ratios.
* **Interactive Swipe Files:** Bookmark and group high-performing posts into swipe files for quick reference and ideation.
* **Cross-Network Ad Library:** Discover active ad creatives from Meta, LinkedIn, and Google to study competitors' funnels and messaging.
* **Server-Side HEIC Transcoding:** Automatically convert TikTok HEVC-HEIC media to standard web formats on the fly for seamless in-browser playback.
* **Background Sync Queue:** Handles long-running platform syncs asynchronously in the background via BullMQ, keeping the user interface fast and snappy.
* **Secure User Accounts:** Built-in account management allowing users to update their profile name, email, and change passwords.

---

## Self-Hosting with Docker

Spydeck can be deployed locally or self-hosted in a single command using Docker Compose:

```bash
cp .env.docker.example .env
docker compose up --build
```

Then apply database migrations:
```bash
DATABASE_URL=postgresql://socialplanner:socialplanner@localhost:5432/socialplanner \
  pnpm --filter api db:migrate
```

*For complete setup instructions, manual installation, system requirements, and developer guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).*

---

## License

This project is licensed under the terms of the **GNU Affero General Public License v3.0 (AGPL-3.0)** — see [LICENSE.md](./LICENSE.md) for details.
