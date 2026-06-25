// ponytail: best-effort types from docs; fields marked unknown where doc shape was unclear

export interface TikTokProfileParams {
  handle?: string;
  user_id?: string;
}

export interface TikTokProfileVideosParams {
  handle: string;
  user_id?: string;
  sort_by?: 'latest' | 'popular';
  max_cursor?: string;
  region?: string;
  trim?: boolean;
}

export interface TikTokVideoParams {
  url: string;
  get_transcript?: boolean;
  region?: string;
  trim?: boolean;
}

export interface TikTokTranscriptParams {
  url: string;
  language?: string;
  use_ai_as_fallback?: boolean;
}

export interface TikTokSearchParams {
  query: string;
  date_posted?:
    | 'yesterday'
    | 'this-week'
    | 'this-month'
    | 'last-3-months'
    | 'last-6-months'
    | 'all-time';
  sort_by?: 'relevance' | 'most-liked' | 'date-posted';
  region?: string;
  cursor?: number;
  trim?: boolean;
}

export interface InstagramProfileParams {
  handle: string;
  trim?: boolean;
}

export interface InstagramPostsParams {
  handle: string;
  cursor?: string;
}

export interface InstagramPostParams {
  url: string;
}

export interface InstagramReelsParams {
  handle: string;
  cursor?: string;
}

export interface InstagramTranscriptParams {
  url: string;
}

export interface YouTubeChannelParams {
  handle?: string;
  channel_id?: string;
}

export interface YouTubeChannelVideosParams {
  handle?: string;
  channel_id?: string;
  cursor?: string;
}

export interface YouTubeVideoParams {
  url: string;
  get_transcript?: boolean;
}

export interface YouTubeTranscriptParams {
  url: string;
  language?: string;
}

export interface YouTubeSearchParams {
  query: string;
  cursor?: string;
}

export interface TwitterProfileParams {
  handle: string;
}

export interface TwitterTweetsParams {
  handle: string;
  cursor?: string;
}

export interface TwitterTweetParams {
  url: string;
}
