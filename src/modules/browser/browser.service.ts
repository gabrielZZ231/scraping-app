import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { chromium, Browser, BrowserContext } from 'playwright';

@Injectable()
export class BrowserService implements OnModuleInit, OnModuleDestroy {
  private browser: Browser | null = null;

  async onModuleInit() {
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
  }

  getBrowser(): Browser {
    if (!this.browser) {
      throw new Error('Browser não inicializado.');
    }
    return this.browser;
  }

  async createRequestContext(): Promise<BrowserContext> {
    const browser = this.getBrowser();
    return await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
      locale: 'pt-BR',
      viewport: { width: 1366, height: 768 },
    });
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
