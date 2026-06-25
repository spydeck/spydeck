import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SwipeService } from './swipe.service';
import { CreateSwipeDto } from './swipe.dto';

@Controller('swipe')
export class SwipeController {
  constructor(private readonly swipeService: SwipeService) {}

  @Get()
  findAll(@Query('authorId') authorId?: string) {
    return this.swipeService.findAll(authorId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  save(@Body() dto: CreateSwipeDto) {
    return this.swipeService.save(dto);
  }

  @Delete(':postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('postId', ParseUUIDPipe) postId: string) {
    return this.swipeService.remove(postId);
  }
}
