import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { AdvertisersService } from './advertisers.service';
import { AdvertiserChannelDto, CreateAdvertiserDto } from './advertisers.dto';

@Controller('advertisers')
export class AdvertisersController {
  constructor(private readonly service: AdvertisersService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAdvertiserDto) {
    return this.service.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/channels')
  addChannel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdvertiserChannelDto,
  ) {
    return this.service.addChannel(id, dto);
  }

  @Delete(':id/channels/:channelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeChannel(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('channelId', ParseUUIDPipe) channelId: string,
  ) {
    return this.service.removeChannel(id, channelId);
  }
}
