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
    description: 'Navega até a URL informada ou realiza uma busca por nome para extrair título, preço, imagem e descrição.'
  })
  @ApiQuery({ 
    name: 'target', 
    required: true, 
    example: 'https://www.netshoes.com.br/p/tenis-puma-flyer-flex-bdp-masculino-PI3-0499-375?sellerId=0',
    description: 'A URL da página do produto ou o nome para busca.'
  })
  @ApiOkResponse({ 
    description: 'Dados extraídos com sucesso.', 
    type: ProductResponseDto 
  })
  @ApiBadRequestResponse({ 
    description: 'O alvo (URL ou nome) não foi informado.',
    type: ScrapeErrorDto
  })
  @ApiUnprocessableEntityResponse({ 
    description: 'Falha técnica ao tentar acessar ou extrair dados.',
    type: ScrapeErrorDto
  })
  async getScrape(@Query('target') target: string) {
    if (!target) {
      throw new BadRequestException('O parâmetro "target" (URL ou nome) é obrigatório.');
    }

    return await this.scraperService.scrapeProduct(target);
  }
}
