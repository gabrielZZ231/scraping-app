import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ example: 'Tênis Puma Flyer Flex Bdp Masculino' })
  titulo: string;

  @ApiProperty({ example: 'R$ 199,99' })
  preco: string;

  @ApiProperty({ example: 'https://static.netshoes.com.br/produtos/tenis-puma-flyer-flex-bdp-masculino/06/PI3-0499-006/PI3-0499-006_zoom1.jpg' })
  imagem: string;

  @ApiProperty({ example: 'O Tênis Puma Flyer Flex Bdp Masculino é a escolha certa...' })
  descricao: string;

  @ApiProperty({ example: 'https://www.netshoes.com.br/p/tenis-puma-flyer-flex-bdp-masculino-PI3-0499-375' })
  url: string;

  @ApiProperty({ example: '2024-05-20T10:00:00.000Z' })
  coletadoEm: string;
}

export class ScrapeErrorDto {
  @ApiProperty({ example: 422 })
  statusCode: number;

  @ApiProperty({ example: 'Falha na extração dos dados: Timeout exceeded' })
  message: string;

  @ApiProperty({ example: 'Unprocessable Entity' })
  error: string;
}
