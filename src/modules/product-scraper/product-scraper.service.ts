import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { BrowserContext, Page } from 'playwright';
import { BrowserService } from '../browser/browser.service';
import { ProductPage, ProductData } from './product-page';

@Injectable()
export class ProductScraperService {
  constructor(private readonly browserService: BrowserService) {}

  private isHttpUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  private async resolveProductUrl(page: Page, targetInput: string): Promise<string> {
    if (this.isHttpUrl(targetInput)) return targetInput;

    const normalizedSearch = encodeURIComponent(targetInput.trim());
    const searchUrl = `https://www.netshoes.com.br/busca/${normalizedSearch}`;

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    const firstProductUrl = await page.$$eval('a[href*="/p/"]', (anchors: any[]) => {
      const validLink = anchors
        .map((anchor) => anchor.href)
        .find((href) => href && href.includes('/p/'));
      return validLink || null;
    });

    if (!firstProductUrl) throw new Error('Nenhum produto encontrado para o termo informado.');
    return firstProductUrl;
  }

  async scrapeProduct(target: string): Promise<ProductData & { url: string; coletadoEm: string }> {
    let context: BrowserContext | null = null;

    try {
      context = await this.browserService.createRequestContext();
      const page = await context.newPage();
      
      const productUrl = await this.resolveProductUrl(page, target);

      const productPage = new ProductPage(page);
      await productPage.maps(productUrl);
      const data = await productPage.extractProductData();

      return {
        ...data,
        url: productUrl,
        coletadoEm: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error(`Erro ao extrair dados de "${target}":`, error.message);
      throw new UnprocessableEntityException(`Falha na extração dos dados: ${error.message}`);
    } finally {
      if (context) {
        await context.close();
      }
    }
  }
}
