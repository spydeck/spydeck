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
