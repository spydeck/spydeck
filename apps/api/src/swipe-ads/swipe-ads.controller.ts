import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SwipeAdsService } from './swipe-ads.service';
import {
  CreateSwipeAdsCategoryDto,
  SaveSwipeAdDto,
  SetSwipeAdCategoryDto,
  SwipeAdsQueryDto,
} from './swipe-ads.dto';

@Controller('swipe-ads')
export class SwipeAdsController {
  constructor(private readonly service: SwipeAdsService) {}

  @Get('categories')
  listCategories() {
    return this.service.listCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateSwipeAdsCategoryDto) {
    return this.service.createCategory(dto);
  }

  @Get()
  list(@Query() q: SwipeAdsQueryDto) {
    return this.service.list(q);
  }

  @Post()
  save(@Body() dto: SaveSwipeAdDto) {
    return this.service.save(dto);
  }

  @Delete(':adId')
  remove(@Param('adId') adId: string) {
    return this.service.remove(adId);
  }

  @Patch(':adId/category')
  setCategory(
    @Param('adId') adId: string,
    @Body() dto: SetSwipeAdCategoryDto,
  ) {
    return this.service.setCategory(adId, dto);
  }
}
