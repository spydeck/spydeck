import { Controller, Get } from '@nestjs/common';
import { ApifyService } from './apify.service';

@Controller('apify')
export class ApifyController {
  constructor(private readonly apify: ApifyService) {}

  @Get('usage')
  getUsage() {
    return this.apify.getUsage();
  }
}
