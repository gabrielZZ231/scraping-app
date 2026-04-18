# scraping-app

Scraper em Node.js com Playwright, estruturado com Orientacao a Objetos no padrao Page Object Model (POM), focado em pagina de produto.

## Objetivo

Extrair os seguintes dados de uma pagina de produto:

- titulo
- preco
- imagem
- descricao

O resultado e salvo no arquivo resultado.json na raiz do projeto.

## Alvo atual

O projeto esta configurado para extrair dados de uma pagina de produto da Netshoes.

## Boas praticas de scraping legal aplicadas

- Respeito a rotas nao permitidas informadas em robots (bloqueio local de paths disallow).
- Controle de ritmo entre requisicoes para reduzir risco de rate limit.
- User-Agent realista e cabecalhos HTTP padrao de navegador.
- Retry com backoff para erros transientes de rede.
- Interrupcao quando houver indicios de captcha ou bloqueio de acesso.

## Estrutura

- src/BasePage.js: classe base com metodo generico de navegacao.
- src/ProductPage.js: classe especializada na extracao de dados de produto.
- src/index.js: ponto de entrada do scraper.
- tests/scraper.test.js: testes unitarios com Jest.

## Requisitos

- Node.js 18 ou superior
- npm

## Instalacao

Execute na raiz do projeto:

npm install

## Executar o scraper

node src/index.js

Depois do comando, o terminal vai pedir:

- URL direta de um produto
- ou nome do produto para busca

Tambem e possivel informar direto na linha de comando:

node src/index.js "tenis puma masculino"
node src/index.js "https://www.netshoes.com.br/p/tenis-puma-flyer-flex-bdp-masculino-PI3-0499-375?sellerId=0"

Ao final, sera criado o arquivo resultado.json com:

- titulo
- preco
- imagem
- descricao

O arquivo resultado.json funciona em modo historico:

- cada nova execucao adiciona um novo item
- os itens antigos sao preservados
- o formato final e uma lista de objetos

## Executar os testes

npm test
