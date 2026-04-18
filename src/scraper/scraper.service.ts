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

  private isHttpUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (error) {
      return false;
    }
  }

  private async resolveProductUrl(page: any, targetInput: string): Promise<string> {
    if (this.isHttpUrl(targetInput)) return targetInput;

    const normalizedSearch = encodeURIComponent(targetInput.trim());
    const searchUrl = `https://www.netshoes.com.br/busca/${normalizedSearch}`;

    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

    const firstProductUrl = await page.$$eval('a[href*="/p/"]', (anchors: any[]) => {
      const validLink = anchors
        .map((anchor) => anchor.href)
        .find((href) => href && href.includes("/p/"));
      return validLink || null;
    });

    if (!firstProductUrl) throw new Error("Nenhum produto encontrado para o termo informado.");
    return firstProductUrl;
  }

  async scrapeProduct(target: string) {
    const browser = await this.getBrowser();
    let context: BrowserContext | null = null;

    try {
      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        locale: 'pt-BR',
        viewport: { width: 1366, height: 768 },
      });

      const page = await context.newPage();
      
      const productUrl = await this.resolveProductUrl(page, target);

      const productPage = new ProductPage(page);
      await productPage.Maps(productUrl);
      const data = await productPage.extractProductData();

      return {
        ...data,
        url: productUrl,
        coletadoEm: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Erro ao extrair dados de "${target}":`, error.message);
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
