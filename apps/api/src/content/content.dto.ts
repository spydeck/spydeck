import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsObject,
  IsDateString,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EngagementDto {
  @IsNumber()
  likes!: number;

  @IsNumber()
  comments!: number;

  @IsNumber()
  views!: number;

  @IsNumber()
  shares!: number;
}

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
  @ValidateNested()
  @Type(() => EngagementDto)
  engagement?: EngagementDto;
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
  @ValidateNested()
  @Type(() => EngagementDto)
  engagement?: EngagementDto;
}
