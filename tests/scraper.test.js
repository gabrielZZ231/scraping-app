const ProductPage = require("../src/ProductPage");

function createMockPage({
  textBySelector = {},
  attrBySelector = {},
  jsonLdScripts = [],
  title = "Pagina de produto",
  content = "<html><body>mock</body></html>",
} = {}) {
  return {
    waitForLoadState: jest.fn().mockResolvedValue(undefined),
    title: jest.fn().mockResolvedValue(title),
    content: jest.fn().mockResolvedValue(content),
    $eval: jest
      .fn()
      .mockImplementation(async (selector, pageFunction, ...args) => {
        const attribute = args[0];

        if (attribute) {
          if (!(selector in attrBySelector)) {
            throw new Error("Selector não encontrado: " + selector);
          }

          const element = {
            getAttribute: (name) =>
              name === attribute ? attrBySelector[selector] : null,
          };

          return pageFunction(element, attribute);
        }

        if (!(selector in textBySelector)) {
          throw new Error("Selector não encontrado: " + selector);
        }

        return pageFunction({ textContent: textBySelector[selector] });
      }),
    $$eval: jest.fn().mockImplementation(async (selector, pageFunction) => {
      if (selector !== 'script[type="application/ld+json"]') {
        throw new Error("Seletor não suportado no mock: " + selector);
      }

      const scripts = jsonLdScripts.map((textContent) => ({ textContent }));
      return pageFunction(scripts);
    }),
  };
}

describe("ProductPage.extractProductData", () => {
  test("deve extrair os quatro campos com os seletores principais da pagina de produto", async () => {
    const mockPage = createMockPage({
      textBySelector: {
        "h1.product-name": "Tênis Puma Flyer Flex Bdp Masculino - Chumbo+Cinza",
        ".price-box__saleInCents .saleInCents-value": "R$ 249,99",
        "p.features--description":
          "Supere os seus desafios! Tênis esportivo para corrida, academia e dia a dia.",
      },
      attrBySelector: {
        "img.carousel-item-figure__image":
          "https://static.netshoes.com.br/produtos/tenis-puma-flyer-flex-bdp-masculino/75/PI3-0499-375/PI3-0499-375_zoom1.jpg",
      },
      title: "Tênis Puma Flyer Flex Bdp Masculino - Chumbo+Cinza | Netshoes",
    });

    const productPage = new ProductPage(mockPage);
    const data = await productPage.extractProductData();

    expect(data).toEqual({
      titulo: "Tênis Puma Flyer Flex Bdp Masculino - Chumbo+Cinza",
      preco: "R$ 249,99",
      imagem:
        "https://static.netshoes.com.br/produtos/tenis-puma-flyer-flex-bdp-masculino/75/PI3-0499-375/PI3-0499-375_zoom1.jpg",
      descricao:
        "Supere os seus desafios! Tênis esportivo para corrida, academia e dia a dia.",
    });
  });

  test("deve usar fallback de JSON-LD para preco, imagem e descricao", async () => {
    const jsonLdProduct = JSON.stringify({
      "@context": "https://schema.org/",
      "@graph": [
        {
          "@type": "Product",
          name: "Tênis Adidas Runfalcon Masculino",
          image: [
            "https://static.netshoes.com.br/produtos/tenis-adidas-runfalcon-masculino/26/ABC-1234-026/ABC-1234-026_zoom1.jpg",
          ],
          description:
            "Tênis leve e confortável para treinos e uso diário com cabedal respirável.",
          offers: {
            "@type": "AggregateOffer",
            lowPrice: "299.99",
            priceCurrency: "BRL",
          },
        },
      ],
    });

    const mockPage = createMockPage({
      textBySelector: {
        "h1.product-name": "Tênis Adidas Runfalcon Masculino",
      },
      jsonLdScripts: [jsonLdProduct],
      title: "Tênis Adidas Runfalcon Masculino | Netshoes",
    });

    const productPage = new ProductPage(mockPage);
    const data = await productPage.extractProductData();

    expect(data).toEqual({
      titulo: "Tênis Adidas Runfalcon Masculino",
      preco: "R$ 299,99",
      imagem:
        "https://static.netshoes.com.br/produtos/tenis-adidas-runfalcon-masculino/26/ABC-1234-026/ABC-1234-026_zoom1.jpg",
      descricao:
        "Tênis leve e confortável para treinos e uso diário com cabedal respirável.",
    });

    expect(mockPage.$$eval).toHaveBeenCalledWith(
      'script[type="application/ld+json"]',
      expect.any(Function),
    );
  });
});
