import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';

const BASE_URL = 'https://api.scrapecreators.com';

// ponytail: typed params live in the DTOs; service uses object for simplicity
type Params = Record<string, string | number | boolean | undefined | null>;

@Injectable()
export class ScrapeCreatorsService {
  constructor(
    private readonly config: ConfigService,
    private readonly settings: SettingsService,
  ) {}

  private async getApiKey(): Promise<string> {
    const all = await this.settings.findAll();
    const key =
      (all['scrapeCreatorsKey'] as string | undefined) ??
      this.config.get<string>('SCRAPECREATORS_API_KEY');
    if (!key) {
      throw new HttpException(
        'ScrapeCreators API key not configured. Set scrapeCreatorsKey in settings or SCRAPECREATORS_API_KEY env var.',
        HttpStatus.PRECONDITION_FAILED,
      );
    }
    return key;
  }

  private async request<T>(path: string, params: Params = {}): Promise<T> {
    const apiKey = await this.getApiKey();
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) qs.set(k, String(v));
    }
    const url = `${BASE_URL}${path}${qs.size ? '?' + qs.toString() : ''}`;
    const res = await fetch(url, { headers: { 'x-api-key': apiKey } });
    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText);
      throw new HttpException(`ScrapeCreators: ${body}`, res.status);
    }
    return res.json() as Promise<T>;
  }

  // ── TikTok ──────────────────────────────────────────────────────────────────

  tiktokProfile(p: Params) { return this.request('/v1/tiktok/profile', p); }
  tiktokProfileVideos(p: Params) { return this.request('/v3/tiktok/profile/videos', p); }
  tiktokVideo(p: Params) { return this.request('/v2/tiktok/video', p); }
  tiktokTranscript(p: Params) { return this.request('/v1/tiktok/video/transcript', p); }
  tiktokSearchKeyword(p: Params) { return this.request('/v1/tiktok/search/keyword', p); }

  // ── Instagram ───────────────────────────────────────────────────────────────

  instagramProfile(p: Params) { return this.request('/v1/instagram/profile', p); }
  instagramPosts(p: Params) { return this.request('/v2/instagram/user/posts', p); }
  instagramPost(p: Params) { return this.request('/v1/instagram/post', p); }
  instagramReels(p: Params) { return this.request('/v1/instagram/user/reels', p); }
  instagramTranscript(p: Params) { return this.request('/v2/instagram/media/transcript', p); }

  // ── YouTube ─────────────────────────────────────────────────────────────────

  youtubeChannel(p: Params) { return this.request('/v1/youtube/channel', p); }
  youtubeChannelVideos(p: Params) { return this.request('/v1/youtube/channel-videos', p); }
  youtubeVideo(p: Params) { return this.request('/v1/youtube/video', p); }
  youtubeTranscript(p: Params) { return this.request('/v1/youtube/video/transcript', p); }
  youtubeSearch(p: Params) { return this.request('/v1/youtube/search', p); }

  // ── Twitter/X ───────────────────────────────────────────────────────────────

  twitterProfile(p: Params) { return this.request('/v1/twitter/profile', p); }
  twitterTweets(p: Params) { return this.request('/v1/twitter/user-tweets', p); }
  twitterTweet(p: Params) { return this.request('/v1/twitter/tweet', p); }
}
