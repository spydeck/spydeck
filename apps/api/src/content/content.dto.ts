import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class CreateContentDto {
  @IsUUID()
  authorId!: string;

  @IsEnum(['instagram', 'tiktok', 'youtube', 'x', 'facebook'])
  platform!: 'instagram' | 'tiktok' | 'youtube' | 'x' | 'facebook';

  @IsString()
  text!: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  postUrl?: string;

  @IsEnum(['draft', 'scheduled', 'published'])
  status!: 'draft' | 'scheduled' | 'published';

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsNumber()
  likes?: number;

  @IsOptional()
  @IsNumber()
  views?: number;

  @IsOptional()
  @IsNumber()
  shares?: number;

  @IsOptional()
  @IsNumber()
  comments?: number;
}

export class UpdateContentDto {
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @IsOptional()
  @IsEnum(['instagram', 'tiktok', 'youtube', 'x', 'facebook'])
  platform?: 'instagram' | 'tiktok' | 'youtube' | 'x' | 'facebook';

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  postUrl?: string;

  @IsOptional()
  @IsEnum(['draft', 'scheduled', 'published'])
  status?: 'draft' | 'scheduled' | 'published';

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsNumber()
  likes?: number;

  @IsOptional()
  @IsNumber()
  views?: number;

  @IsOptional()
  @IsNumber()
  shares?: number;

  @IsOptional()
  @IsNumber()
  comments?: number;
}
