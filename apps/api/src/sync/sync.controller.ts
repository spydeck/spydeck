import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { ExtractProfileDto, SaveSyncConfigsDto } from './sync.dto';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('health')
  health() {
    return this.syncService.health();
  }

  @Post('authors/:id/extract-profile')
  @HttpCode(HttpStatus.ACCEPTED)
  extractProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExtractProfileDto,
  ) {
    return this.syncService.enqueueProfileExtract({
      authorId: id,
      platform: dto.platform,
    });
  }

  @Put('authors/:id/sync-config')
  saveSyncConfigs(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveSyncConfigsDto,
  ) {
    return this.syncService.saveSyncConfigs(id, dto.configs);
  }
}
