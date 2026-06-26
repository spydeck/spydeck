import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExtractProfileDto {
  @IsOptional()
  @IsIn(['instagram', 'tiktok', 'youtube', 'x'])
  platform?: 'instagram' | 'tiktok' | 'youtube' | 'x';
}

export class AdDetailExtractDto {
  @IsIn(['linkedin', 'meta', 'tiktok', 'google'])
  platform!: 'linkedin' | 'meta' | 'tiktok' | 'google';

  // Stable ad id, used as the persistence key.
  @IsString()
  @IsNotEmpty()
  externalId!: string;

  // LinkedIn and Google details are fetched by ad URL; Meta and TikTok by ad id.
  @ValidateIf(
    (o: AdDetailExtractDto) =>
      o.platform === 'linkedin' || o.platform === 'google',
  )
  @IsString()
  @IsNotEmpty()
  url?: string;

  @ValidateIf(
    (o: AdDetailExtractDto) => o.platform === 'meta' || o.platform === 'tiktok',
  )
  @IsString()
  @IsNotEmpty()
  adId?: string;
}

export class AdDetailBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdDetailExtractDto)
  ads!: AdDetailExtractDto[];
}

export class AdDetailLookupDto {
  @IsIn(['linkedin', 'meta', 'tiktok', 'google'])
  platform!: 'linkedin' | 'meta' | 'tiktok' | 'google';

  @IsArray()
  @IsString({ each: true })
  externalIds!: string[];
}

export class SyncConfigItemDto {
  @IsIn(['instagram', 'tiktok', 'youtube', 'x'])
  platform!: 'instagram' | 'tiktok' | 'youtube' | 'x';

  @IsIn(['full', 'count', 'range'])
  mode!: 'full' | 'count' | 'range';

  @ValidateIf((o: SyncConfigItemDto) => o.mode === 'count')
  @IsInt()
  @Min(1)
  count?: number;

  @ValidateIf((o: SyncConfigItemDto) => o.mode === 'range')
  @IsDateString()
  from?: string;

  @ValidateIf((o: SyncConfigItemDto) => o.mode === 'range')
  @IsDateString()
  to?: string;
}

export class SaveSyncConfigsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncConfigItemDto)
  configs!: SyncConfigItemDto[];
}
