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
import {
  AdDetailExtractDto,
  ExtractProfileDto,
  SaveSyncConfigsDto,
} from './sync.dto';

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

  @Post('authors/:id/sync-posts')
  @HttpCode(HttpStatus.ACCEPTED)
  syncPosts(@Param('id', ParseUUIDPipe) id: string) {
    return this.syncService.enqueueSyncPosts({ authorId: id });
  }

  @Post('ad-detail')
  @HttpCode(HttpStatus.ACCEPTED)
  extractAdDetail(@Body() dto: AdDetailExtractDto) {
    return this.syncService.enqueueAdDetailExtract(dto);
  }

  @Put('authors/:id/sync-config')
  saveSyncConfigs(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveSyncConfigsDto,
  ) {
    return this.syncService.saveSyncConfigs(id, dto.configs);
  }
}
