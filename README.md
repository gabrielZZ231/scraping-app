# Scraper App - API & CLI

Aplicação robusta de web scraping desenvolvida com **Node.js** e **Playwright**, estruturada seguindo o padrão **Page Object Model (POM)**. O sistema oferece uma solução completa para extração de dados de produtos através de uma interface de linha de comando (CLI) e uma API RESTful moderna com **NestJS**.

## 🚀 Funcionalidades

- **Extração Completa**: Captura Título, Preço, Imagem e Descrição de páginas de produtos.
- **Inteligência de Extração**: Utiliza seletores CSS otimizados com fallback automático para dados estruturados (**JSON-LD**).
- **Processamento em Tempo Real**: A aplicação **não utiliza persistência de dados** (banco de dados ou cache local). Cada requisição realiza uma nova consulta ao alvo para garantir dados atualizados.
- **Scraping Ético e Legal**:
  - Controle de ritmo (Rate Limiting) para evitar sobrecarga no alvo.
  - Rotação de User-Agents realistas.
  - Retry com backoff exponencial para falhas de rede.
  - Detecção automática de Captchas e bloqueios.
- **Interface Visual**: Documentação interativa via **Swagger** para testes rápidos da API.

## 📋 Requisitos

- **Node.js**: v18 ou superior.
- **npm**: v9 ou superior.

## 🛠️ Instalação

1. Clone o repositório para sua máquina local.
2. Instale as dependências do projeto:
   ```bash
   npm install
   ```
3. Configure a porta do servidor criando um arquivo `.env` na raiz:
   ```env
   PORT=3000
   ```

## 💻 Como Executar

### 1. Servidor de API (NestJS)

A API é a forma recomendada para integrar o scraper com outros sistemas ou realizar testes via navegador.

- **Modo Desenvolvimento (com auto-reload):**
  ```bash
  npm run start:dev
  ```
- **Modo Produção:**
  ```bash
  npm run build
  npm run start:prod
  ```
- **Documentação e Testes:** Com o servidor rodando, acesse a interface do Swagger em:  
  `http://localhost:3000/api`

### 2. Ferramenta de Linha de Comando (CLI)

Para execuções rápidas diretamente do terminal, utilize o script de entrada:

- **Busca por Nome:**
  ```bash
  node src/index.js "nome do produto desejado"
  ```
- **Consulta por URL Direta:**
  ```bash
  node src/index.js "https://link-do-site.com.br/produto-exemplo"
  ```
- **Modo Interativo:**
  ```bash
  node src/index.js
  ```
  *O resultado da extração será exibido em formato JSON formatado diretamente no seu terminal.*

## 🧪 Testes

O projeto conta com uma suite de testes unitários para validar a lógica de extração e os seletores:

```bash
npm test
```

## 🏗️ Estrutura do Projeto

- `src/`: Núcleo da aplicação (BasePage, ProductPage e Servidor NestJS).
- `tests/`: Testes automatizados com Jest.
- `prints/`: Evidências de execução e capturas de tela do sistema.

> **Nota sobre o desenvolvimento**: O arquivo `GEMINI.md` é utilizado apenas para contexto interno do assistente e está configurado no `.gitignore` para não ser enviado ao repositório GitHub.
