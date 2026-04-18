import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ example: 'Tênis Puma Flyer Flex Bdp Masculino - Chumbo+Cinza', description: 'Título completo do produto' })
  titulo: string;

  @ApiProperty({ example: 'R$ 249,99', description: 'Preço formatado em BRL' })
  preco: string;

  @ApiProperty({ example: 'https://static.netshoes.com.br/produtos/.../zoom1.jpg', description: 'URL da imagem principal' })
  imagem: string;

  @ApiProperty({ example: 'Supere os seus desafios! O Tênis Puma...', description: 'Descrição textual do produto' })
  descricao: string;
}

export class ScrapeErrorDto {
  @ApiProperty({ example: 'A URL informada possui um formato inválido.' })
  message: string;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: 400 })
  statusCode: number;
}
