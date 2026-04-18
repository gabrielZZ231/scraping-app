import { Controller, Get, Query, UnprocessableEntityException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiOkResponse, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { ProductScraperService } from './product-scraper.service';
import { ProductResponseDto, ScrapeErrorDto } from './product-scraper.dto';

@ApiTags('Product Scraper')
@Controller('scrape')
export class ProductScraperController {
  constructor(private readonly productScraperService: ProductScraperService) {}

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
  @ApiUnprocessableEntityResponse({
    description: 'Falha técnica ao tentar acessar ou extrair dados.',
    type: ScrapeErrorDto
  })
  async scrape(@Query('target') target: string) {
    if (!target) {
      throw new UnprocessableEntityException('O parâmetro "target" é obrigatório.');
    }
    return this.productScraperService.scrapeProduct(target);
  }
}
