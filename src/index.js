const readline = require("node:readline/promises");
const { stdin, stdout, stderr, argv } = require("node:process");
const { chromium } = require("playwright");
const ProductPage = require("./ProductPage");

if (typeof stdout.setDefaultEncoding === "function") {
  stdout.setDefaultEncoding("utf8");
}

if (typeof stderr.setDefaultEncoding === "function") {
  stderr.setDefaultEncoding("utf8");
}

const MIN_REQUEST_INTERVAL_MS = 2500;
let lastRequestAt = 0;

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
}

async function readTargetInput() {
  const argInput = argv.slice(2).join(" ").trim();
  if (argInput) return argInput;

  const terminal = readline.createInterface({ input: stdin, output: stdout });
  try {
    const answer = await terminal.question("Digite a URL do produto ou o nome para busca: ");
    const target = answer.trim();
    if (!target) throw new Error("Nenhum produto informado no terminal.");
    return target;
  } finally {
    terminal.close();
  }
}

async function resolveProductUrl(page, targetInput) {
  if (isHttpUrl(targetInput)) return targetInput;

  const normalizedSearch = encodeURIComponent(targetInput.trim());
  const searchUrl = `https://www.netshoes.com.br/busca/${normalizedSearch}`;

  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

  const firstProductUrl = await page.$$eval('a[href*="/p/"]', (anchors) => {
    const validLink = anchors
      .map((anchor) => anchor.href)
      .find((href) => href && href.includes("/p/"));
    return validLink || null;
  });

  if (!firstProductUrl) throw new Error("Nenhum produto encontrado para o termo informado.");
  return firstProductUrl;
}

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function waitForRateLimitWindow() {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await sleep(MIN_REQUEST_INTERVAL_MS - elapsed + 400);
  }
  lastRequestAt = Date.now();
}

async function runScraper() {
  let browser;
  try {
    const targetInput = await readTargetInput();

    browser = await chromium.launch({ headless: true });
    const page = await (await browser.newContext()).newPage();
    
    await waitForRateLimitWindow();
    const productUrl = await resolveProductUrl(page, targetInput);
    
    console.log("Iniciando extração da página...");
    const productPage = new ProductPage(page);
    await productPage.Maps(productUrl);
    const data = await productPage.extractProductPage ? await productPage.extractProductData() : null;

    if (!data) {
        throw new Error("Falha ao extrair dados da página.");
    }

    const result = { ...data, url: productUrl, coletadoEm: new Date().toISOString() };

    console.log("Extração concluída. Resultado:");
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("Falha ao executar o scraper:", error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
}

runScraper();
