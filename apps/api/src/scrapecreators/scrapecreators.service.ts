import { Injectable } from '@nestjs/common';
import { ScrapeCreatorsClient, Params } from './scrapecreators.client';

@Injectable()
export class ScrapeCreatorsService {
  constructor(private readonly client: ScrapeCreatorsClient) {}

  // ── TikTok ──────────────────────────────────────────────────────────────────

  tiktokProfile(p: Params) { return this.client.request('/v1/tiktok/profile', p); }
  tiktokProfileVideos(p: Params) { return this.client.request('/v3/tiktok/profile/videos', p); }
  tiktokVideo(p: Params) { return this.client.request('/v2/tiktok/video', p); }
  tiktokTranscript(p: Params) { return this.client.request('/v1/tiktok/video/transcript', p); }
  tiktokSearchKeyword(p: Params) { return this.client.request('/v1/tiktok/search/keyword', p); }

  // ── Instagram ───────────────────────────────────────────────────────────────

  instagramProfile(p: Params) { return this.client.request('/v1/instagram/profile', p); }
  instagramPosts(p: Params) { return this.client.request('/v2/instagram/user/posts', p); }
  instagramPost(p: Params) { return this.client.request('/v1/instagram/post', p); }
  instagramReels(p: Params) { return this.client.request('/v1/instagram/user/reels', p); }
  instagramTranscript(p: Params) { return this.client.request('/v2/instagram/media/transcript', p); }

  // ── YouTube ─────────────────────────────────────────────────────────────────

  youtubeChannel(p: Params) { return this.client.request('/v1/youtube/channel', p); }
  youtubeChannelVideos(p: Params) { return this.client.request('/v1/youtube/channel-videos', p); }
  youtubeVideo(p: Params) { return this.client.request('/v1/youtube/video', p); }
  youtubeTranscript(p: Params) { return this.client.request('/v1/youtube/video/transcript', p); }
  youtubeSearch(p: Params) { return this.client.request('/v1/youtube/search', p); }

  // ── Twitter/X ───────────────────────────────────────────────────────────────

  twitterProfile(p: Params) { return this.client.request('/v1/twitter/profile', p); }
  twitterTweets(p: Params) { return this.client.request('/v1/twitter/user-tweets', p); }
  twitterTweet(p: Params) { return this.client.request('/v1/twitter/tweet', p); }
}
