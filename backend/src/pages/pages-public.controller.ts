import { Controller, Get, Param } from '@nestjs/common';
import { PagesService } from './pages.service';

@Controller('pages/public')
export class PagesPublicController {
  constructor(private readonly pagesService: PagesService) {}

  @Get(':slug')
  getPublicBySlug(@Param('slug') slug: string) {
    return this.pagesService.getPublicBySlug(slug);
  }
}
