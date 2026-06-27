import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';

// Helper: coerce string 'true'/'false' from query string to boolean
const toBool = () =>
  Transform(({ value }) => value === 'true' || value === true);

export class TikTokProfileDto {
  @IsOptional() @IsString() handle?: string;
  @IsOptional() @IsString() user_id?: string;
}

export class TikTokProfileVideosDto {
  @IsString() handle!: string;
  @IsOptional() @IsString() user_id?: string;
  @IsOptional() @IsEnum(['latest', 'popular']) sort_by?: 'latest' | 'popular';
  @IsOptional() @IsString() max_cursor?: string;
  @IsOptional() @IsString() region?: string;
}

export class TikTokVideoDto {
  @IsString() url!: string;
  @IsOptional() @toBool() @IsBoolean() get_transcript?: boolean;
  @IsOptional() @IsString() region?: string;
}

export class TikTokTranscriptDto {
  @IsString() url!: string;
  @IsOptional() @IsString() language?: string;
  @IsOptional() @toBool() @IsBoolean() use_ai_as_fallback?: boolean;
}

export class TikTokSearchDto {
  @IsString() query!: string;
  @IsOptional()
  @IsEnum([
    'yesterday',
    'this-week',
    'this-month',
    'last-3-months',
    'last-6-months',
    'all-time',
  ])
  date_posted?: string;
  @IsOptional()
  @IsEnum(['relevance', 'most-liked', 'date-posted'])
  sort_by?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsNumber() cursor?: number;
}

export class InstagramProfileDto {
  @IsString() handle!: string;
}

export class InstagramPostsDto {
  @IsString() handle!: string;
  @IsOptional() @IsString() cursor?: string;
}

export class InstagramPostDto {
  @IsString() url!: string;
}

export class InstagramReelsDto {
  @IsString() handle!: string;
  @IsOptional() @IsString() cursor?: string;
}

export class InstagramTranscriptDto {
  @IsString() url!: string;
}

export class YouTubeChannelDto {
  @IsOptional() @IsString() handle?: string;
  @IsOptional() @IsString() channel_id?: string;
}

export class YouTubeChannelVideosDto {
  @IsOptional() @IsString() handle?: string;
  @IsOptional() @IsString() channel_id?: string;
  @IsOptional() @IsString() cursor?: string;
}

export class YouTubeVideoDto {
  @IsString() url!: string;
  @IsOptional() @toBool() @IsBoolean() get_transcript?: boolean;
}

export class YouTubeTranscriptDto {
  @IsString() url!: string;
  @IsOptional() @IsString() language?: string;
}

export class YouTubeSearchDto {
  @IsString() query!: string;
  @IsOptional() @IsString() cursor?: string;
}

export class TwitterProfileDto {
  @IsString() handle!: string;
}

export class TwitterTweetsDto {
  @IsString() handle!: string;
  @IsOptional() @IsString() cursor?: string;
}

export class TwitterTweetDto {
  @IsString() url!: string;
}
