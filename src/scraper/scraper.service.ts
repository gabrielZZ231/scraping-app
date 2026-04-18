import { Injectable, OnModuleDestroy, UnprocessableEntityException } from '@nestjs/common';
import { chromium, Browser, BrowserContext } from 'playwright';
const ProductPage = require('../ProductPage');

@Injectable()
export class ScraperService implements OnModuleDestroy {
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
    return this.browser;
  }

  async scrapeProduct(url: string) {
    const browser = await this.getBrowser();
    let context: BrowserContext | null = null;

    try {
      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        locale: 'pt-BR',
        viewport: { width: 1366, height: 768 },
      });

      const page = await context.newPage();
      const productPage = new ProductPage(page);

      await productPage.Maps(url);
      const data = await productPage.extractProductData();

      return data;
    } catch (error) {
      console.error(`Erro ao extrair dados da URL ${url}:`, error.message);
      throw new UnprocessableEntityException(`Falha na extração dos dados: ${error.message}`);
    } finally {
      if (context) {
        await context.close();
      }
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
