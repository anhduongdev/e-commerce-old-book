import { Controller, Get, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { QueryCatalogProductsDto } from './dto/query-catalog-products.dto';

// Public storefront API — deliberately NOT behind AdminGuard. Only exposes
// ACTIVE products with a public-safe field set (no sku/stockQuantity/
// reservedQuantity/status — see CatalogService's response mappers).
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  list(@Query() query: QueryCatalogProductsDto) {
    return this.catalogService.list(query);
  }

  @Get('filters')
  filters() {
    return this.catalogService.getFilters();
  }
}
