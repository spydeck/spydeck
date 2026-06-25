import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class ExtractProfileDto {
  @IsOptional()
  @IsIn(['instagram', 'tiktok', 'youtube', 'x'])
  platform?: 'instagram' | 'tiktok' | 'youtube' | 'x';
}