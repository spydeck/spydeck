import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateAuthorDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsObject()
  socials?: Record<string, { value: string; synchronize: boolean }>;
}

export class UpdateAuthorDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsObject()
  socials?: Record<string, { value: string; synchronize: boolean }>;
}
