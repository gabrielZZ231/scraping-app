import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Geral')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Status da aplicação' })
  getHello() {
    return {
      name: 'Scraper API',
      status: 'Online',
      docs: '/api',
      message: 'Bem-vindo à API de Web Scraping. Acesse /api para documentação Swagger.'
    };
  }
}
