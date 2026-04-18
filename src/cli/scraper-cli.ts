import { chromium, Page } from 'playwright';
import { ProductPage } from '../modules/product-scraper/product-page';
import * as readline from 'node:readline/promises';
import { stdin, stdout, argv } from 'node:process';

async function readTargetInput(): Promise<string> {
  const argInput = argv.slice(2).join(' ').trim();
  if (argInput) return argInput;

  const terminal = readline.createInterface({ input: stdin, output: stdout });
  try {
    const answer = await terminal.question('Digite a URL do produto ou o nome para busca: ');
    const target = answer.trim();
    if (!target) throw new Error('Nenhum produto informado.');
    return target;
  } finally {
    terminal.close();
  }
}

async function resolveProductUrl(page: Page, targetInput: string): Promise<string> {
  if (targetInput.startsWith('http')) return targetInput;

  const normalizedSearch = encodeURIComponent(targetInput.trim());
  const searchUrl = `https://www.netshoes.com.br/busca/${normalizedSearch}`;

  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const firstProductUrl = await page.$$eval('a[href*="/p/"]', (anchors: any[]) => {
    const validLink = anchors
      .map((anchor) => anchor.href)
      .find((href) => href && href.includes('/p/'));
    return validLink || null;
  });

  if (!firstProductUrl) throw new Error('Produto não encontrado.');
  return firstProductUrl;
}

async function runCli() {
  const browser = await chromium.launch({ headless: true });
  try {
    const targetInput = await readTargetInput();
    const page = await browser.newPage();
    
    const productUrl = await resolveProductUrl(page, targetInput);
    const productPage = new ProductPage(page);
    await productPage.maps(productUrl);
    const data = await productPage.extractProductData();

    console.log(JSON.stringify({ ...data, url: productUrl, coletadoEm: new Date().toISOString() }, null, 2));
  } catch (error: any) {
    console.error('Erro:', error.message);
  } finally {
    await browser.close();
  }
}

runCli();
