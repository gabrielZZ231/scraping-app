# 🕷️ Scraping App Modular 2.0 (NestJS + Playwright)

Uma solução profissional de **Web Scraping** para extração de dados de produtos, construída com **NestJS**, **Playwright** e **TypeScript**. O projeto utiliza o padrão **Page Object Model (POM)** e uma arquitetura modularizada para máxima manutenibilidade e escalabilidade.

---

## 🏗️ Arquitetura do Projeto

A estrutura segue os princípios de separação de responsabilidades (SoC) e injeção de dependências:

- **`src/common/`**: Lógica de infraestrutura compartilhada.
    - `scraping/`: Contém a `BasePage` (abstração de navegação com retries, backoff exponencial e delays aleatórios).
- **`src/modules/`**: Módulos funcionais isolados.
    - `browser/`: Gerenciamento centralizado do ciclo de vida do navegador (Singleton via NestJS).
    - `product-scraper/`: Lógica específica para extração de dados de produtos (Título, Preço, Imagem, Descrição).
- **`src/cli/`**: Interface de linha de comando para execuções rápidas sem necessidade da API HTTP.
- **`src/main.ts`**: Ponto de entrada do servidor NestJS.

---

## 🚀 Funcionalidades Principais

- **Resiliência Avançada**: Implementação de *Retry* automático e *Exponential Backoff* para lidar com instabilidades de rede.
- **Detecção de Bloqueios**: Monitoramento proativo de Captchas e telas de "Acesso Negado".
- **Evasão de Bots**: Rotação de *User-Agents*, *viewports* realistas e delays humanos aleatórios.
- **Fallback Inteligente**: Extração visual via seletores CSS combinada com parsing de dados estruturados **JSON-LD**.
- **API RESTful**: Documentação interativa completa via **Swagger**.

---

## 🛠️ Instalação e Configuração

1. **Instalar Dependências**:
   ```bash
   npm install
   ```

2. **Configurar Ambiente**:
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   PORT=3000
   ```

---

## 💻 Como Utilizar

### 1. Servidor API (NestJS)
Ideal para integração com outros sistemas via HTTP.

- **Iniciar Servidor:**
  ```bash
  npm run start:dev
  ```
- **Interface Swagger:** [http://localhost:3000/api](http://localhost:3000/api)
- **Endpoint de Extração:** `GET /scrape?target=URL_OU_NOME`

### 2. Interface CLI (Linha de Comando)
Ideal para extrações rápidas diretamente no terminal.

- **Executar Busca:**
  ```bash
  npm run cli "nome do produto"
  # OU
  npm run cli "https://url-do-produto.com.br"
  ```
  *O resultado será exibido em formato JSON estruturado diretamente no stdout.*

---

## 🧪 Testes Automatizados

Valide a integridade da extração e os mecanismos de fallback:
```bash
npm test
```

---

## ⚙️ Características Técnicas

- **NestJS v11+**: Injeção de dependências e organização modular.
- **Playwright v1.59+**: Automação robusta com suporte a Webkit, Chromium e Firefox.
- **Swagger**: Documentação automática dos endpoints.
- **TypeScript**: Tipagem estática em todo o core da aplicação.
