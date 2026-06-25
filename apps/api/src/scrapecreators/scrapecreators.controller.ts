import { Controller, Get, Query } from '@nestjs/common';
import { ScrapeCreatorsService } from './scrapecreators.service';
import {
  TikTokProfileDto,
  TikTokProfileVideosDto,
  TikTokVideoDto,
  TikTokTranscriptDto,
  TikTokSearchDto,
  InstagramProfileDto,
  InstagramPostsDto,
  InstagramPostDto,
  InstagramReelsDto,
  InstagramTranscriptDto,
  YouTubeChannelDto,
  YouTubeChannelVideosDto,
  YouTubeVideoDto,
  YouTubeTranscriptDto,
  YouTubeSearchDto,
  TwitterProfileDto,
  TwitterTweetsDto,
  TwitterTweetDto,
} from './scrapecreators.dto';

@Controller('scrapecreators')
export class ScrapeCreatorsController {
  constructor(private readonly sc: ScrapeCreatorsService) {}

  // ── TikTok ──────────────────────────────────────────────────────────────────

  @Get('tiktok/profile')
  tiktokProfile(@Query() q: TikTokProfileDto) {
    return this.sc.tiktokProfile({ ...q });
  }

  @Get('tiktok/videos')
  tiktokVideos(@Query() q: TikTokProfileVideosDto) {
    return this.sc.tiktokProfileVideos({ ...q });
  }

  @Get('tiktok/video')
  tiktokVideo(@Query() q: TikTokVideoDto) {
    return this.sc.tiktokVideo({ ...q });
  }

  @Get('tiktok/transcript')
  tiktokTranscript(@Query() q: TikTokTranscriptDto) {
    return this.sc.tiktokTranscript({ ...q });
  }

  @Get('tiktok/search')
  tiktokSearch(@Query() q: TikTokSearchDto) {
    return this.sc.tiktokSearchKeyword({ ...q });
  }

  // ── Instagram ───────────────────────────────────────────────────────────────

  @Get('instagram/profile')
  instagramProfile(@Query() q: InstagramProfileDto) {
    return this.sc.instagramProfile({ ...q });
  }

  @Get('instagram/posts')
  instagramPosts(@Query() q: InstagramPostsDto) {
    return this.sc.instagramPosts({ ...q });
  }

  @Get('instagram/post')
  instagramPost(@Query() q: InstagramPostDto) {
    return this.sc.instagramPost({ ...q });
  }

  @Get('instagram/reels')
  instagramReels(@Query() q: InstagramReelsDto) {
    return this.sc.instagramReels({ ...q });
  }

  @Get('instagram/transcript')
  instagramTranscript(@Query() q: InstagramTranscriptDto) {
    return this.sc.instagramTranscript({ ...q });
  }

  // ── YouTube ─────────────────────────────────────────────────────────────────

  @Get('youtube/channel')
  youtubeChannel(@Query() q: YouTubeChannelDto) {
    return this.sc.youtubeChannel({ ...q });
  }

  @Get('youtube/videos')
  youtubeVideos(@Query() q: YouTubeChannelVideosDto) {
    return this.sc.youtubeChannelVideos({ ...q });
  }

  @Get('youtube/video')
  youtubeVideo(@Query() q: YouTubeVideoDto) {
    return this.sc.youtubeVideo({ ...q });
  }

  @Get('youtube/transcript')
  youtubeTranscript(@Query() q: YouTubeTranscriptDto) {
    return this.sc.youtubeTranscript({ ...q });
  }

  @Get('youtube/search')
  youtubeSearch(@Query() q: YouTubeSearchDto) {
    return this.sc.youtubeSearch({ ...q });
  }

  // ── Twitter/X ───────────────────────────────────────────────────────────────

  @Get('twitter/profile')
  twitterProfile(@Query() q: TwitterProfileDto) {
    return this.sc.twitterProfile({ ...q });
  }

  @Get('twitter/tweets')
  twitterTweets(@Query() q: TwitterTweetsDto) {
    return this.sc.twitterTweets({ ...q });
  }

  @Get('twitter/tweet')
  twitterTweet(@Query() q: TwitterTweetDto) {
    return this.sc.twitterTweet({ ...q });
  }
}
