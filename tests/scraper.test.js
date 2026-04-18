const { ProductPage } = require("../src/modules/product-scraper/product-page");

function createMockPage({
  textBySelector = {},
  attrBySelector = {},
  jsonLdScripts = [],
  title = "Página de Produto",
  content = "<html><body>mock</body></html>",
} = {}) {
  return {
    waitForLoadState: jest.fn().mockResolvedValue(undefined),
    title: jest.fn().mockResolvedValue(title),
    content: jest.fn().mockResolvedValue(content),
    $eval: jest.fn().mockImplementation(async (selector, pageFunction, ...args) => {
      const attribute = args[0];
      if (attribute) {
        if (!(selector in attrBySelector)) throw new Error("Not found");
        return pageFunction({ getAttribute: (n) => (n === attribute ? attrBySelector[selector] : null) }, attribute);
      }
      if (!(selector in textBySelector)) throw new Error("Not found");
      return pageFunction({ textContent: textBySelector[selector] });
    }),
    $$eval: jest.fn().mockImplementation(async (selector, pageFunction) => {
      const scripts = jsonLdScripts.map((textContent) => ({ textContent }));
      return pageFunction(scripts);
    }),
  };
}

describe("ProductPage", () => {
  test("deve extrair dados com sucesso usando seletores", async () => {
    const mockPage = createMockPage({
      textBySelector: {
        "h1.product-name": "Produto Teste",
        ".price-box .saleInCents-value": "R$ 100,00",
        "p.features--description": "Descrição Teste",
      },
      attrBySelector: { "img.carousel-item-figure__image": "http://image.jpg" },
    });
    const pp = new ProductPage(mockPage);
    const data = await pp.extractProductData();
    expect(data.titulo).toBe("Produto Teste");
    expect(data.preco).toBe("R$ 100,00");
  });

  test("deve usar JSON-LD como fallback", async () => {
    const jsonLd = JSON.stringify({
      "@type": "Product",
      name: "Produto LD",
      offers: { price: "150.00" },
    });
    const mockPage = createMockPage({ jsonLdScripts: [jsonLd] });
    const pp = new ProductPage(mockPage);
    const data = await pp.extractProductData();
    expect(data.titulo).toBe("Produto LD");
    expect(data.preco).toBe("R$ 150,00");
  });

  test("deve lançar erro em caso de bloqueio (Captcha)", async () => {
    const mockPage = createMockPage({ title: "Request Blocked" });
    const pp = new ProductPage(mockPage);
    await expect(pp.extractProductData()).rejects.toThrow("Acesso bloqueado");
  });
});
