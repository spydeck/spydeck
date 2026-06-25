import { IsString } from 'class-validator';

export class UpsertSettingDto {
  // ponytail: empty string is valid — it means the setting is cleared/unset
  @IsString()
  value!: string;
}
