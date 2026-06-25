import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { ApifyClient } from './apify.client';
import { ApifyService } from './apify.service';
import { ApifyController } from './apify.controller';

@Module({
  imports: [SettingsModule],
  controllers: [ApifyController],
  providers: [ApifyClient, ApifyService],
})
export class ApifyModule {}
