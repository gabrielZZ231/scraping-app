# Scraper API & CLI

Uma solução completa de **Web Scraping** para extração de dados de produtos, construída com **Node.js** e **Playwright**. O projeto utiliza o padrão **Page Object Model (POM)** para garantir modularidade e facilidade de manutenção.

## 🚀 Principais Tecnologias

- **Node.js**: Ambiente de execução.
- **Playwright**: Automação de navegador para renderização de páginas dinâmicas.
- **NestJS**: Framework para a disponibilização da API REST.
- **Swagger**: Documentação interativa da API.
- **Jest**: Framework de testes unitários.

## 📋 Requisitos

- Node.js v18+
- npm v9+

## 🛠️ Instalação e Configuração

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure o ambiente:
   Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:
   ```env
   PORT=3000
   ```

## 💻 Como Executar

### 1. Servidor API (NestJS)
O servidor permite consultas via HTTP e possui documentação interativa.

- **Iniciar Servidor:**
  ```bash
  npm run start:dev
  ```
- **Acessar API:**
  - **Interface Swagger:** `http://localhost:3000/api`
  - **Status da API:** `http://localhost:3000/`
  - **Busca via URL:** `http://localhost:3000/scrape?target=NOME_OU_URL`

### 2. Ferramenta CLI
Execute consultas rápidas diretamente pelo terminal.

- **Busca por nome ou URL:**
  ```bash
  node src/index.js "link-do-produto-ou-nome"
  ```
  *O resultado será exibido em formato JSON formatado.*

## 🧪 Testes Automatizados

Para validar a lógica de extração e os mecanismos de fallback:
```bash
npm test
```

## ⚙️ Características Técnicas

- **Resiliência**: Implementação de *Retry* com *Exponential Backoff* para lidar com falhas de rede.
- **Evasão de Bloqueios**: Rotação de *User-Agents* e detecção proativa de Captchas.
- **Fallback Inteligente**: Caso os seletores visuais falhem devido a mudanças no layout da página, o sistema tenta extrair dados estruturados via **JSON-LD**.
- **Processamento Real-time**: A aplicação não persiste dados, garantindo que as informações extraídas sejam sempre as mais atuais da página.

## 📂 Estrutura de Pastas

- `src/`: Core da aplicação (Navegação, Extração e Servidor).
- `tests/`: Testes automatizados.
- `prints/`: Capturas de tela das evidências de execução.
