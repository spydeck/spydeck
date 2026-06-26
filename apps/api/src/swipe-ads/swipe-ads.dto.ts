import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreateSwipeAdsCategoryDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() color?: string;
}

export class SaveSwipeAdDto {
  // The full NormalizedAd from the web app (must include an `id`).
  @IsObject() ad!: Record<string, unknown>;
  @IsOptional() @IsIn(['manual', 'telegram']) source?: 'manual' | 'telegram';
  @IsOptional() @IsUUID() categoryId?: string;
}

export class SwipeAdsQueryDto {
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsIn(['manual', 'telegram']) source?: 'manual' | 'telegram';
}

export class SetSwipeAdCategoryDto {
  // Pass a category id to assign, or null to clear.
  @ValidateIf((o: SetSwipeAdCategoryDto) => o.categoryId !== null)
  @IsUUID()
  categoryId!: string | null;
}
