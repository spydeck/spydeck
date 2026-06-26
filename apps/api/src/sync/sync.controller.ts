import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import type { AdPlatform } from './ad-detail.strategy';
import {
  AdDetailBatchDto,
  AdDetailExtractDto,
  AdDetailLookupDto,
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

  @Post('ad-details')
  @HttpCode(HttpStatus.ACCEPTED)
  extractAdDetails(@Body() dto: AdDetailBatchDto) {
    return this.syncService.enqueueAdDetailExtractBatch(dto.ads);
  }

  @Post('ad-details/lookup')
  @HttpCode(HttpStatus.OK)
  lookupAdDetails(@Body() dto: AdDetailLookupDto) {
    return this.syncService.getPersistedAdIds(dto.platform, dto.externalIds);
  }

  @Get('ad-details/:platform/:externalId')
  async getAdDetail(
    @Param('platform') platform: string,
    @Param('externalId') externalId: string,
  ) {
    const row = await this.syncService.getAdDetail(
      platform as AdPlatform,
      externalId,
    );
    if (!row) throw new NotFoundException('Ad detail not found');
    return row;
  }

  @Put('authors/:id/sync-config')
  saveSyncConfigs(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveSyncConfigsDto,
  ) {
    return this.syncService.saveSyncConfigs(id, dto.configs);
  }
}
