import { Controller, Get, Put, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpsertSettingDto } from './settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Put(':key')
  @HttpCode(HttpStatus.OK)
  upsert(@Param('key') key: string, @Body() dto: UpsertSettingDto) {
    return this.settingsService.upsert(key, dto.value);
  }
}
