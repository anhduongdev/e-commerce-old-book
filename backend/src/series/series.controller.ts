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
import { SeriesService } from './series.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { QuerySeriesDto } from './dto/query-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';

@Controller('series')
@UseGuards(AdminGuard)
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Get()
  list(@Query() query: QuerySeriesDto) {
    return this.seriesService.list(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.seriesService.findOne(BigInt(id));
  }

  @Post()
  create(@Body() dto: CreateSeriesDto) {
    return this.seriesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSeriesDto) {
    return this.seriesService.update(BigInt(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.seriesService.remove(BigInt(id));
  }
}
