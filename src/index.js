const fs = require("fs/promises");
const path = require("path");
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

const OUTPUT_FILE_PATH = path.resolve(process.cwd(), "resultado.json");
const MIN_REQUEST_INTERVAL_MS = 2500;

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
];

let lastRequestAt = 0;

function pickUserAgent() {
  const index = Math.floor(Math.random() * USER_AGENTS.length);
  return USER_AGENTS[index];
}

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
  if (argInput) {
    return argInput;
  }

  const terminal = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  try {
    const answer = await terminal.question(
      "Digite a URL do produto ou o nome para busca: ",
    );

    const target = answer.trim();
    if (!target) {
      throw new Error("Nenhum produto informado no terminal.");
    }

    return target;
  } finally {
    terminal.close();
  }
}

async function resolveProductUrl(page, targetInput) {
  if (isHttpUrl(targetInput)) {
    return targetInput;
  }

  const normalizedSearch = encodeURIComponent(targetInput.trim());
  const searchUrl = `https://www.netshoes.com.br/busca/${normalizedSearch}`;

  await page.goto(searchUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await page
    .waitForLoadState("networkidle", { timeout: 10000 })
    .catch(() => {});

  const firstProductUrl = await page.$$eval('a[href*="/p/"]', (anchors) => {
    const validLink = anchors
      .map((anchor) => anchor.href)
      .find((href) => href && href.includes("/p/"));

    return validLink || null;
  });

  if (!firstProductUrl) {
    throw new Error("Nenhum produto encontrado para o termo informado.");
  }

  return firstProductUrl;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadResultHistory() {
  try {
    const content = await fs.readFile(OUTPUT_FILE_PATH, "utf-8");
    const parsed = JSON.parse(content);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (parsed && typeof parsed === "object") {
      return [parsed];
    }

    return [];
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function appendResultToHistory(result) {
  const history = await loadResultHistory();
  history.push(result);

  await fs.writeFile(
    OUTPUT_FILE_PATH,
    JSON.stringify(history, null, 2),
    "utf-8",
  );
  return history.length;
}

async function waitForRateLimitWindow() {
  // Garante intervalo mínimo entre navegações para evitar rajadas de acesso.
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    const jitter = Math.floor(Math.random() * 600) + 200;
    await sleep(MIN_REQUEST_INTERVAL_MS - elapsed + jitter);
  }

  lastRequestAt = Date.now();
}

async function runScraper() {
  let browser;

  try {
    const targetInput = await readTargetInput();

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: pickUserAgent(),
      locale: "pt-BR",
      timezoneId: "America/Sao_Paulo",
      viewport: { width: 1366, height: 768 },
      extraHTTPHeaders: {
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        DNT: "1",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    const page = await context.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);

    await waitForRateLimitWindow();

    const productUrl = await resolveProductUrl(page, targetInput);
    console.log("Produto selecionado para scraping:", productUrl);

    const productPage = new ProductPage(page);
    await productPage.Maps(productUrl);

    const result = await productPage.extractProductData();

    const totalItems = await appendResultToHistory({
      ...result,
      url: productUrl,
      coletadoEm: new Date().toISOString(),
    });

    console.log(
      `Extração concluída. Registro adicionado em resultado.json. Total de itens: ${totalItems}.`,
    );
  } catch (error) {
    console.error("Falha ao executar o scraper:", error);
    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runScraper();
