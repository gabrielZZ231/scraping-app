const BasePage = require("./BasePage");

/**
 * Specialized page object for extracting product data from Netshoes.
 * @extends BasePage
 */
class ProductPage extends BasePage {
  /**
   * @param {import('playwright').Page} page - The Playwright page instance.
   * @param {Object} [options={}] - Configuration options.
   */
  constructor(page, options = {}) {
    super(page, options);
    this.productJsonLdCache = null;
  }

  /**
   * Extracts product data (title, price, image, description) from the current page.
   * @returns {Promise<{titulo: string|null, preco: string|null, imagem: string|null, descricao: string|null}>}
   */
  async extractProductData() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.randomDelay(400, 900);
    await this.assertNoAutomationOrCaptchaBlock();

    // Prioriza seletores visíveis no DOM e usa JSON-LD como fallback.
    const titulo =
      (await this.getTextByPriority([
        "h1.product-name",
        "h1[data-productname]",
        "h1.short-description",
      ])) || (await this.getTitleFromJsonLd());

    const preco = await this.getPriceValue();
    const imagem = await this.getImageValue();
    const descricao = await this.getDescriptionValue();

    return {
      titulo,
      preco,
      imagem,
      descricao,
    };
  }

  /**
   * Checks if the page is blocked by captcha or automation protection.
   * @throws {Error} If a block is detected.
   * @returns {Promise<void>}
   */
  async assertNoAutomationOrCaptchaBlock() {
    // Interrompe execução quando a página indica captcha ou bloqueio explícito.
    const pageTitle = await this.page.title();
    const html = await this.page.content();
    const blockPatterns = [/captcha/i, /acesso negado/i, /request blocked/i];

    const isBlocked = blockPatterns.some(
      (pattern) => pattern.test(pageTitle) || pattern.test(html),
    );

    if (isBlocked) {
      throw new Error(
        "A página retornou indícios de bloqueio automatizado. Interrompendo para manter scraping legal.",
      );
    }
  }

  /**
   * Extracts the product price using CSS selectors or JSON-LD fallback.
   * @returns {Promise<string|null>}
   */
  async getPriceValue() {
    const directPrice = await this.getTextByPriority([
      ".price-box__saleInCents .saleInCents-value",
      ".price-box .saleInCents-value",
      "div.price-box strong",
      ".default-price",
    ]);

    const normalizedDirectPrice = this.normalizePrice(directPrice);
    if (normalizedDirectPrice) {
      return normalizedDirectPrice;
    }

    const jsonLdProduct = await this.getProductFromJsonLd();
    const lowPrice = jsonLdProduct?.offers?.lowPrice;
    const currency = jsonLdProduct?.offers?.priceCurrency || "BRL";

    return this.formatPriceFromNumber(lowPrice, currency);
  }

  /**
   * Extracts the product image URL using CSS selectors or JSON-LD fallback.
   * @returns {Promise<string|null>}
   */
  async getImageValue() {
    const directImage = await this.getAttributeByPriority(
      [
        "img.carousel-item-figure__image",
        ".zoom-img",
        ".photo-figure img",
        'meta[property="og:image"]',
      ],
      "src",
    );

    if (directImage) {
      return directImage;
    }

    const ogImage = await this.getAttributeByPriority(
      ['meta[property="og:image"]'],
      "content",
    );
    if (ogImage) {
      return ogImage;
    }

    const jsonLdProduct = await this.getProductFromJsonLd();
    if (Array.isArray(jsonLdProduct?.image) && jsonLdProduct.image.length > 0) {
      return this.normalizeText(jsonLdProduct.image[0]);
    }

    return this.normalizeText(jsonLdProduct?.image || null) || null;
  }

  /**
   * Extracts the product description using CSS selectors or JSON-LD fallback.
   * @returns {Promise<string|null>}
   */
  async getDescriptionValue() {
    const directDescription = await this.getTextByPriority([
      "p.features--description",
      ".feature__main-content",
      "p.description",
      "#features",
    ]);

    if (directDescription) {
      return directDescription;
    }

    const jsonLdProduct = await this.getProductFromJsonLd();
    return this.normalizeText(jsonLdProduct?.description || null) || null;
  }

  /**
   * Extracts the title from JSON-LD script tags.
   * @returns {Promise<string|null>}
   */
  async getTitleFromJsonLd() {
    const jsonLdProduct = await this.getProductFromJsonLd();
    return this.normalizeText(jsonLdProduct?.name || null) || null;
  }

  /**
   * Retrieves the Product node from JSON-LD script tags.
   * @returns {Promise<Object|null>}
   */
  async getProductFromJsonLd() {
    if (this.productJsonLdCache) {
      return this.productJsonLdCache;
    }

    // Faz parse dos blocos JSON-LD e armazena em cache para evitar releituras.
    try {
      const rawJsonLdScripts = await this.page.$$eval(
        'script[type="application/ld+json"]',
        (scripts) => scripts.map((script) => script.textContent || ""),
      );

      for (const scriptContent of rawJsonLdScripts) {
        try {
          const parsed = JSON.parse(scriptContent);
          const product = this.findProductNode(parsed);

          if (product) {
            this.productJsonLdCache = product;
            return product;
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  /**
   * Finds a 'Product' type node in a JSON-LD object.
   * @param {Object} jsonLd - Parsed JSON-LD content.
   * @returns {Object|null}
   */
  findProductNode(jsonLd) {
    if (!jsonLd || typeof jsonLd !== "object") {
      return null;
    }

    if (jsonLd["@type"] === "Product") {
      return jsonLd;
    }

    if (Array.isArray(jsonLd["@graph"])) {
      return (
        jsonLd["@graph"].find(
          (node) =>
            node && typeof node === "object" && node["@type"] === "Product",
        ) || null
      );
    }

    if (Array.isArray(jsonLd)) {
      return (
        jsonLd.find(
          (node) =>
            node && typeof node === "object" && node["@type"] === "Product",
        ) || null
      );
    }

    return null;
  }

  /**
   * Tries to get text content from a list of selectors by priority.
   * @param {string[]} selectors - Array of CSS selectors.
   * @returns {Promise<string|null>}
   */
  async getTextByPriority(selectors) {
    // Tenta os seletores em ordem até encontrar um valor válido.
    for (const selector of selectors) {
      try {
        const value = await this.page.$eval(
          selector,
          (element) => element.textContent || "",
        );
        const normalized = this.normalizeText(value);

        if (normalized) {
          return normalized;
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  /**
   * Tries to get an attribute value from a list of selectors by priority.
   * @param {string[]} selectors - Array of CSS selectors.
   * @param {string} attribute - Attribute name.
   * @returns {Promise<string|null>}
   */
  async getAttributeByPriority(selectors, attribute) {
    for (const selector of selectors) {
      try {
        const value = await this.page.$eval(
          selector,
          (element, attr) => element.getAttribute(attr) || "",
          attribute,
        );
        const normalized = this.normalizeText(value);

        if (normalized) {
          return normalized;
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  /**
   * Normalizes text by trimming and collapsing whitespace.
   * @param {string} value - Text to normalize.
   * @returns {string}
   */
  normalizeText(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value.replace(/\s+/g, " ").trim();
  }

  /**
   * Normalizes price strings.
   * @param {string} value - Price text to normalize.
   * @returns {string|null}
   */
  normalizePrice(value) {
    // Normaliza variações de preço (texto com R$ ou valor numérico cru).
    const text = this.normalizeText(value || "");
    if (!text) {
      return null;
    }

    const matchWithCurrency = text.match(/R\$\s*[\d.]+,\d{2}/);
    if (matchWithCurrency) {
      return matchWithCurrency[0];
    }

    const numeric = this.parseNumber(text);
    if (numeric === null) {
      return null;
    }

    return this.formatPriceFromNumber(numeric, "BRL");
  }

  /**
   * Parses a numeric value from a string.
   * @param {string} value - String containing a number.
   * @returns {number|null}
   */
  parseNumber(value) {
    if (value === null || value === undefined) {
      return null;
    }

    const text = String(value).trim();
    if (!text) {
      return null;
    }

    if (text.includes(",") && text.includes(".")) {
      const normalized = text
        .replace(/\./g, "")
        .replace(",", ".")
        .replace(/[^\d.]/g, "");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }

    if (text.includes(",")) {
      const normalized = text.replace(/[^\d,]/g, "").replace(",", ".");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }

    const normalized = text.replace(/[^\d.]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  /**
   * Formats a number as a currency string.
   * @param {number|string} value - Numeric value.
   * @param {string} [currency='BRL'] - Currency code.
   * @returns {string|null}
   */
  formatPriceFromNumber(value, currency = "BRL") {
    const amount = this.parseNumber(value);
    if (amount === null) {
      return null;
    }

    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);

    return formatted.replace(/\u00a0/g, " ");
  }
}

module.exports = ProductPage;
