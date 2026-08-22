import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('posts')
@UseGuards(AdminGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  list(@Query() query: QueryPostDto) {
    return this.postsService.list(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(BigInt(id));
  }

  @Post()
  create(@Body() dto: CreatePostDto, @Req() req: Request) {
    // AdminGuard has already run and set req.user before this handler executes.
    return this.postsService.create(dto, req.user!.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.update(BigInt(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(BigInt(id));
  }
}
