import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiOkResponse, ApiBadRequestResponse, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { ScraperService } from './scraper.service';
import { ProductResponseDto, ScrapeErrorDto } from './scraper.dto';

@ApiTags('Scraper')
@Controller('scrape')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Extrair dados de produto',
    description: 'Navega até a URL informada e tenta extrair título, preço, imagem e descrição via seletores CSS ou JSON-LD.'
  })
  @ApiQuery({ 
    name: 'url', 
    required: true, 
    example: 'https://www.netshoes.com.br/p/tenis-puma-flyer-flex-bdp-masculino-PI3-0499-375?sellerId=0',
    description: 'A URL da página do produto que deseja consultar.'
  })
  @ApiOkResponse({ 
    description: 'Dados extraídos com sucesso.', 
    type: ProductResponseDto 
  })
  @ApiBadRequestResponse({ 
    description: 'A URL não foi informada ou o formato é inválido.',
    type: ScrapeErrorDto
  })
  @ApiUnprocessableEntityResponse({ 
    description: 'Falha técnica ao tentar acessar ou extrair dados da URL.',
    type: ScrapeErrorDto
  })
  async getScrape(@Query('url') url: string) {
    if (!url) {
      throw new BadRequestException('A URL é obrigatória via query parameter.');
    }

    if (!this.isValidUrl(url)) {
      throw new BadRequestException('A URL informada possui um formato inválido.');
    }

    return await this.scraperService.scrapeProduct(url);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }
}
