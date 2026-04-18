# Usar a imagem oficial do Playwright que já contém os navegadores e dependências
FROM mcr.microsoft.com/playwright:v1.59.1-jammy

# Definir diretório de trabalho
WORKDIR /app

# Garantir que estamos no ambiente correto para o build
ENV NODE_ENV=development

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar TODAS as dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Executar o build do TypeScript
RUN npm run build

# Expor a porta que o NestJS usa
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "dist/main.js"]
