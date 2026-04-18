/**
 * Base class for all page objects, providing common navigation and utility methods.
 */
class BasePage {
  /**
   * @param {import('playwright').Page} page - The Playwright page instance.
   * @param {Object} [options={}] - Configuration options.
   * @param {number} [options.maxRetries=3] - Maximum number of retries for navigation.
   * @param {number} [options.baseDelayMs=1000] - Base delay for backoff mechanism.
   */
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

  /**
   * Navigates to a URL with retry and backoff logic.
   * @param {string} url - The URL to navigate to.
   * @returns {Promise<import('playwright').Response|null>} The page response.
   * @throws {Error} If navigation fails after all retries.
   */
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

  /**
   * Pauses execution for a specified duration.
   * @param {number} ms - The number of milliseconds to sleep.
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generates a random integer between min and max.
   * @param {number} min - Minimum value.
   * @param {number} max - Maximum value.
   * @returns {number}
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Pauses execution for a random duration within a range.
   * @param {number} minMs - Minimum duration.
   * @param {number} maxMs - Maximum duration.
   * @returns {Promise<void>}
   */
  async randomDelay(minMs, maxMs) {
    const delay = this.randomInt(minMs, maxMs);
    await this.sleep(delay);
  }
}

module.exports = BasePage;
