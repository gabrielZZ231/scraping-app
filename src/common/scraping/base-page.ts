import { Page, Response } from 'playwright';

export interface BasePageOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

export abstract class BasePage {
  protected page: Page;
  protected maxRetries: number;
  protected baseDelayMs: number;

  constructor(page: Page, options: BasePageOptions = {}) {
    if (!page) throw new Error('Uma instância de page do Playwright é obrigatória.');

    this.page = page;
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 1000;
  }

  // Navegação com Retry e Exponential Backoff para lidar com instabilidades de rede
  async maps(url: string): Promise<Response | null> {
    if (!url || !url.trim()) throw new Error('URL inválida.');

    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await this.page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });

        const status = response ? response.status() : null;
        if (status && status >= 400) throw new Error(`HTTP Error: ${status}`);

        await this.randomDelay(300, 800);
        return response;
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.maxRetries) {
          const backoff = this.baseDelayMs * attempt + this.randomInt(200, 600);
          await this.sleep(backoff);
        }
      }
    }
    throw new Error(`Falha após ${this.maxRetries} tentativas: ${lastError?.message}`);
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  protected async randomDelay(minMs: number, maxMs: number): Promise<void> {
    await this.sleep(this.randomInt(minMs, maxMs));
  }
}
