import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ScraperController } from './scraper/scraper.controller';
import { ScraperService } from './scraper/scraper.service';

@Module({
  imports: [],
  controllers: [AppController, ScraperController],
  providers: [ScraperService],
})
export class AppModule {}
