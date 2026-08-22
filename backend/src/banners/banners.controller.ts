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
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { QueryBannerDto } from './dto/query-banner.dto';
import { ReorderBannersDto } from './dto/reorder-banners.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Controller('banners')
@UseGuards(AdminGuard)
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  list(@Query() query: QueryBannerDto) {
    return this.bannersService.list(query);
  }

  @Patch('reorder')
  reorder(@Body() dto: ReorderBannersDto) {
    return this.bannersService.reorder(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bannersService.findOne(BigInt(id));
  }

  @Post()
  create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.bannersService.update(BigInt(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bannersService.remove(BigInt(id));
  }
}
