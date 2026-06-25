import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './db/database.module';
import { AuthorsModule } from './authors/authors.module';
import { ContentModule } from './content/content.module';
import { SwipeModule } from './swipe/swipe.module';
import { SettingsModule } from './settings/settings.module';
import { ScrapeCreatorsModule } from './scrapecreators/scrapecreators.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthorsModule,
    ContentModule,
    SwipeModule,
    SettingsModule,
    ScrapeCreatorsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
