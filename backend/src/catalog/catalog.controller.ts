import { Controller, Get, Param, Query } from '@nestjs/common';
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

  @Get('products/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.catalogService.getBySlug(slug);
  }

  @Get('banners')
  banners(@Query('position') position?: string) {
    return this.catalogService.getBanners(position);
  }

  @Get('categories')
  categories(@Query('featured') featured?: string) {
    return this.catalogService.getCategories(featured === 'true');
  }

  @Get('series')
  seriesList(@Query('limit') limit?: string) {
    return this.catalogService.getSeriesList(limit ? Number(limit) : undefined);
  }

  @Get('series/:slug')
  seriesDetail(@Param('slug') slug: string) {
    return this.catalogService.getSeriesBySlug(slug);
  }
}
