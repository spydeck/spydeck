import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AdvertiserChannelDto {
  @IsIn(['linkedin', 'meta', 'google', 'tiktok'])
  platform!: 'linkedin' | 'meta' | 'google' | 'tiktok';
  @IsString() @IsNotEmpty() externalId!: string;
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsString() logo?: string;
}

export class CreateAdvertiserDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() logo?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdvertiserChannelDto)
  channels?: AdvertiserChannelDto[];
}
