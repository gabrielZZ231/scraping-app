class BasePage {
  constructor(page, options = {}) {
    if (!page) throw new Error("Uma instância de page do Playwright é obrigatória.");

    this.page = page;
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 1000;
  }

  // Navegação com Retry e Exponential Backoff para lidar com instabilidades de rede
  async Maps(url) {
    if (typeof url !== "string" || !url.trim()) throw new Error("URL inválida.");

    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await this.page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });

        const status = response ? response.status() : null;
        if (status && status >= 400) throw new Error(`HTTP Error: ${status}`);

        await this.randomDelay(300, 800);
        return response;
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          const backoff = this.baseDelayMs * attempt + this.randomInt(200, 600);
          await this.sleep(backoff);
        }
      }
    }
    throw new Error(`Falha após ${this.maxRetries} tentativas: ${lastError?.message}`);
  }

  sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
  randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  async randomDelay(minMs, maxMs) { await this.sleep(this.randomInt(minMs, maxMs)); }
}

module.exports = BasePage;
