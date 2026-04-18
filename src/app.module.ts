import { Module } from '@nestjs/common';
import { ScraperController } from './scraper/scraper.controller';
import { ScraperService } from './scraper/scraper.service';

@Module({
  imports: [],
  controllers: [ScraperController],
  providers: [ScraperService],
})
export class AppModule {}
