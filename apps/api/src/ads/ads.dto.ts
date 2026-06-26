import { IsString, IsOptional, IsNotEmpty, Length } from 'class-validator';

export class GoogleAdvertisersDto {
  @IsString() @IsNotEmpty() query!: string;
  @IsOptional() @IsString() @Length(2, 2) region?: string;
}

export class GoogleCompanyAdsDto {
  @IsString() @IsNotEmpty() advertiser_id!: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() start_date?: string;
  @IsOptional() @IsString() end_date?: string;
  @IsOptional() @IsString() platform?: string;
  @IsOptional() @IsString() format?: string;
}

export class MetaAdsDto {
  @IsOptional() @IsString() query?: string;
  @IsOptional() @IsString() @Length(2, 2) country?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() media_type?: string;
  @IsOptional() @IsString() ad_type?: string;
  @IsOptional() @IsString() start_date?: string;
  @IsOptional() @IsString() end_date?: string;
  @IsOptional() @IsString() cursor?: string;
}

export class TikTokAdsDto {
  @IsOptional() @IsString() query?: string;
  @IsOptional() @IsString() @Length(2, 2) region?: string;
  @IsOptional() @IsString() period?: string;
  @IsOptional() @IsString() order_by?: string;
  @IsOptional() @IsString() ad_format?: string;
  @IsOptional() @IsString() cursor?: string;
}

export class LinkedInAdsDto {
  @IsOptional() @IsString() company?: string;
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() countries?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsString() paginationToken?: string;
}

export class LinkedInCompaniesDto {
  @IsString() @IsNotEmpty() query!: string;
}

export class MetaCompaniesDto {
  @IsString() @IsNotEmpty() query!: string;
}
