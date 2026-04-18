# Usar a imagem oficial do Playwright que já contém os navegadores e dependências
FROM mcr.microsoft.com/playwright:v1.59.1-jammy

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências do Node.js
RUN npm install

# Copiar o restante do código (incluindo os arquivos .js que são o núcleo)
COPY . .

# Build do NestJS (TypeScript para a infraestrutura)
RUN npm run build

# Expor a porta que o NestJS usa
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "run", "start:prod"]
