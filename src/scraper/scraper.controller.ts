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
    summary: 'Extrair dados de produto da Netshoes',
    description: 'Navega até a URL informada do site Netshoes e extrai título, preço, imagem e descrição.'
  })
  @ApiQuery({ 
    name: 'url', 
    required: true, 
    example: 'https://www.netshoes.com.br/p/tenis-puma-flyer-flex-bdp-masculino-PI3-0499-375?sellerId=0',
    description: 'A URL direta da página do produto no domínio netshoes.com.br'
  })
  @ApiOkResponse({ 
    description: 'Dados extraídos com sucesso.', 
    type: ProductResponseDto 
  })
  @ApiBadRequestResponse({ 
    description: 'URL ausente ou de domínio não permitido (fora de netshoes.com.br).',
    type: ScrapeErrorDto
  })
  @ApiUnprocessableEntityResponse({ 
    description: 'Falha técnica ao navegar ou extrair dados da página.',
    type: ScrapeErrorDto
  })
  async getScrape(@Query('url') url: string) {
    if (!url) {
      throw new BadRequestException('A URL é obrigatória via query parameter.');
    }

    if (!this.isValidNetshoesUrl(url)) {
      throw new BadRequestException('Apenas links do domínio netshoes.com.br são permitidos.');
    }

    return await this.scraperService.scrapeProduct(url);
  }

  private isValidNetshoesUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const host = parsedUrl.hostname.toLowerCase();
      
      // Valida se o host termina com netshoes.com.br
      return host === 'netshoes.com.br' || host.endsWith('.netshoes.com.br');
    } catch (e) {
      return false;
    }
  }
}
