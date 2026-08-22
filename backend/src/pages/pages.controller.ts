import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreatePageDto } from './dto/create-page.dto';
import { QueryPageDto } from './dto/query-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PagesService } from './pages.service';

@Controller('pages')
@UseGuards(AdminGuard)
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  list(@Query() query: QueryPageDto) {
    return this.pagesService.list(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagesService.findOne(BigInt(id));
  }

  @Post()
  create(@Body() dto: CreatePageDto) {
    return this.pagesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.pagesService.update(BigInt(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pagesService.remove(BigInt(id));
  }
}
