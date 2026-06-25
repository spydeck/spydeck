import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  registerDecorator,
  type ValidationOptions,
} from 'class-validator';
import { isUsername } from '../sync/social-handle';

type SocialsMap = Record<string, { value: string; synchronize: boolean }>;

/**
 * Every social handle must be a username / channel name, not a URL.
 * Rejects pasted profile URLs (which contain ':' or '/').
 */
function IsUsernameSocialsMap(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUsernameSocialsMap',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          if (value == null) return true;
          if (typeof value !== 'object') return false;
          return Object.values(value as SocialsMap).every(
            (entry) => !entry?.value || isUsername(entry.value),
          );
        },
        defaultMessage() {
          return 'Social handles must be a username or channel name, not a URL';
        },
      },
    });
  };
}

export class CreateAuthorDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsObject()
  @IsUsernameSocialsMap()
  socials?: SocialsMap;
}

export class UpdateAuthorDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsObject()
  @IsUsernameSocialsMap()
  socials?: SocialsMap;
}
