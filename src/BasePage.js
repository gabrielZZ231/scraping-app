class BasePage {
  constructor(page, options = {}) {
    if (!page) {
      throw new Error(
        "Uma instância válida de page do Playwright é obrigatória.",
      );
    }

    this.page = page;
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 1000;
  }

  async Maps(url) {
    if (typeof url !== "string" || !url.trim()) {
      throw new Error("A URL informada para navegação é inválida.");
    }

    // Navega com retry e backoff para reduzir falhas transientes de rede.
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await this.page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });

        const status = response ? response.status() : null;
        if (status && status >= 400) {
          throw new Error(`Resposta HTTP inesperada: ${status}`);
        }

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

    throw new Error(
      `Falha ao navegar para a URL após ${this.maxRetries} tentativas: ${lastError?.message || "erro desconhecido"}`,
    );
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async randomDelay(minMs, maxMs) {
    const delay = this.randomInt(minMs, maxMs);
    await this.sleep(delay);
  }
}

module.exports = BasePage;
