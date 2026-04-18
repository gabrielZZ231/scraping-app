import { Page } from 'playwright';
import { BasePage, BasePageOptions } from '../../common/scraping/base-page';

export interface ProductData {
  titulo: string | null;
  preco: string | null;
  imagem: string | null;
  descricao: string | null;
}

export class ProductPage extends BasePage {
  private jsonLdCache: any = null;

  constructor(page: Page, options: BasePageOptions = {}) {
    super(page, options);
  }

  // Ponto de entrada para a extração completa
  async extractProductData(): Promise<ProductData> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.randomDelay(400, 900);
    await this.assertNoBlock();

    return {
      titulo: (await this.getTextByPriority(['h1.product-name', 'h1[data-productname]'])) || (await this.getFromJsonLd('name')),
      preco: await this.getPriceValue(),
      imagem: await this.getImageValue(),
      descricao: await this.getDescriptionValue(),
    };
  }

  // Verifica se a página retornou indícios de Captcha ou Bloqueio
  async assertNoBlock(): Promise<void> {
    const pageTitle = await this.page.title();
    const html = await this.page.content();
    const isBlocked = [/captcha/i, /acesso negado/i, /request blocked/i].some(p => p.test(pageTitle) || p.test(html));
    if (isBlocked) throw new Error('Acesso bloqueado por proteção automatizada.');
  }

  async getPriceValue(): Promise<string | null> {
    const selectors = ['.price-box .saleInCents-value', 'div.price-box strong', '.default-price'];
    const directPrice = await this.getTextByPriority(selectors);
    const normalized = this.normalizePrice(directPrice);
    if (normalized) return normalized;

    const productLd = await this.getProductFromJsonLd();
    return this.formatPrice(productLd?.offers?.lowPrice || productLd?.offers?.price);
  }

  async getImageValue(): Promise<string | null> {
    const selectors = ['img.carousel-item-figure__image', '.zoom-img', '.photo-figure img'];
    const directImage = await this.getAttributeByPriority(selectors, 'src');
    if (directImage) return directImage;

    const ogImage = await this.getAttributeByPriority(['meta[property="og:image"]'], 'content');
    if (ogImage) return ogImage;

    const productLd = await this.getProductFromJsonLd();
    return Array.isArray(productLd?.image) ? productLd.image[0] : (productLd?.image || null);
  }

  async getDescriptionValue(): Promise<string | null> {
    const selectors = ['p.features--description', '.feature__main-content', 'p.description', '#features'];
    const direct = await this.getTextByPriority(selectors);
    if (direct) return direct;

    const productLd = await this.getProductFromJsonLd();
    return productLd?.description || null;
  }

  // Lógica de Parsing para JSON-LD (Fallback de segurança)
  async getProductFromJsonLd(): Promise<any> {
    if (this.jsonLdCache) return this.jsonLdCache;
    try {
      const scripts = await this.page.$$eval('script[type="application/ld+json"]', s => s.map(t => t.textContent));
      for (const content of scripts) {
        if (!content) continue;
        try {
          const parsed = JSON.parse(content);
          const nodes = parsed['@graph'] || (Array.isArray(parsed) ? parsed : [parsed]);
          const product = nodes.find((n: any) => n['@type'] === 'Product');
          if (product) return (this.jsonLdCache = product);
        } catch (e) { continue; }
      }
    } catch (e) { return null; }
    return null;
  }

  async getFromJsonLd(key: string): Promise<any> {
    const product = await this.getProductFromJsonLd();
    return product ? (product[key] || null) : null;
  }

  // Auxiliares de Extração de Atributos e Texto com Prioridade
  async getTextByPriority(selectors: string[]): Promise<string | null> {
    for (const selector of selectors) {
      try {
        const val = await this.page.$eval(selector, (e: any) => e.textContent);
        if (val?.trim()) return val.replace(/\s+/g, ' ').trim();
      } catch (e) { continue; }
    }
    return null;
  }

  async getAttributeByPriority(selectors: string[], attr: string): Promise<string | null> {
    for (const selector of selectors) {
      try {
        const val = await this.page.$eval(selector, (e: any, a: string) => e.getAttribute(a), attr);
        if (val?.trim()) return val.trim();
      } catch (e) { continue; }
    }
    return null;
  }

  // Normalização de Preços para Moeda Brasileira (BRL)
  normalizePrice(text: string | null): string | null {
    if (!text) return null;
    const match = text.match(/R\$\s*[\d.]+,\d{2}/);
    return match ? match[0] : null;
  }

  formatPrice(val: any): string | null {
    if (!val) return null;
    const num = parseFloat(String(val).replace(',', '.'));
    if (isNaN(num)) return null;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num).replace(/\u00a0/g, ' ');
  }
}
