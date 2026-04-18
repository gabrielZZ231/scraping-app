import { Module } from '@nestjs/common';
import { ProductScraperModule } from './modules/product-scraper/product-scraper.module';
import { BrowserModule } from './modules/browser/browser.module';

@Module({
  imports: [
    BrowserModule,
    ProductScraperModule,
  ],
})
export class AppModule {}
