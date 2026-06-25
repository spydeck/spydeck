import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule, type CacheOptions } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
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
import { AdsModule } from './ads/ads.module';

const CACHE_TTL_MS = 3_600_000; // 1 hour

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
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService): CacheOptions => {
        const logger = new Logger('CacheModule');
        const redisUrl = config.get<string>('REDIS_URL');
        if (redisUrl) {
          logger.log(`Using Redis cache store at ${redisUrl}`);
          return {
            ttl: CACHE_TTL_MS,
            stores: [new KeyvRedis(redisUrl)],
          };
        }
        logger.log('REDIS_URL not set — using in-memory cache store');
        return { ttl: CACHE_TTL_MS };
      },
    }),
    DatabaseModule,
    AuthorsModule,
    ContentModule,
    SwipeModule,
    SettingsModule,
    ScrapeCreatorsModule,
    ApifyModule,
    SyncModule,
    AdsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
