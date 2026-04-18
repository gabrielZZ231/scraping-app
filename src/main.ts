import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Scraper API')
    .setDescription('API modular para extração de dados de produtos de páginas web.')
    .setVersion('2.0')
    .addTag('Product Scraper')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Servidor rodando em: http://localhost:${port}`);
  console.log(`📖 Documentação Swagger disponível em: http://localhost:${port}/api`);
}
bootstrap();
