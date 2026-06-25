import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { ExtractProfileDto } from './sync.dto';

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
}
