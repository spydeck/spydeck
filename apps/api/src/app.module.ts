import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './db/database.module';
import { AuthorsModule } from './authors/authors.module';
import { ContentModule } from './content/content.module';
import { SwipeModule } from './swipe/swipe.module';
import { SettingsModule } from './settings/settings.module';
import { ScrapeCreatorsModule } from './scrapecreators/scrapecreators.module';
import { ApifyModule } from './apify/apify.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // ponytail: host/port from env; db index defaults to 0. Add REDIS_DB/REDIS_PASSWORD if needed.
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') ?? 'db',
          port: config.get<number>('REDIS_PORT') ?? 6379,
        },
      }),
    }),
    DatabaseModule,
    AuthorsModule,
    ContentModule,
    SwipeModule,
    SettingsModule,
    ScrapeCreatorsModule,
    ApifyModule,
    SyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
