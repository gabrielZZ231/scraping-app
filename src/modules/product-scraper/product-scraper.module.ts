import { Module } from '@nestjs/common';
import { BrowserModule } from '../browser/browser.module';
import { ProductScraperController } from './product-scraper.controller';
import { ProductScraperService } from './product-scraper.service';

@Module({
  imports: [BrowserModule],
  controllers: [ProductScraperController],
  providers: [ProductScraperService],
  exports: [ProductScraperService],
})
export class ProductScraperModule {}
