import { Controller, Get, Param, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { QueryPublicPostDto } from './dto/query-public-post.dto';

// Public storefront API — deliberately NOT behind AdminGuard. Only exposes
// PUBLISHED, non-deleted posts with a public-safe field set (no content in
// the list response, no status/authorId anywhere — see PostsService's
// response mappers).
@Controller('blog')
export class BlogController {
  constructor(private readonly postsService: PostsService) {}

  @Get('posts')
  listPublished(@Query() query: QueryPublicPostDto) {
    return this.postsService.listPublished(query);
  }

  @Get('posts/:slug')
  getPublishedBySlug(@Param('slug') slug: string) {
    return this.postsService.getPublishedBySlug(slug);
  }
}
