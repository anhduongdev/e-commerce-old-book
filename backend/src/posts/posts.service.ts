import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Post, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { QueryPublicPostDto } from './dto/query-public-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryPostDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Prisma.PostWhereInput = {
      deletedAt: null,
      ...(query.search ? { title: { contains: query.search } } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: bigint) {
    const post = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
    });
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    return this.toResponse(post);
  }

  async create(dto: CreatePostDto, authorId: bigint) {
    try {
      const post = await this.prisma.post.create({
        data: {
          title: dto.title,
          slug: dto.slug,
          excerpt: dto.excerpt,
          content: dto.content,
          thumbnailUrl: dto.thumbnailUrl,
          status: dto.status,
          authorId,
          publishedAt: dto.status === 'PUBLISHED' ? new Date() : undefined,
        },
      });
      return this.toResponse(post);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Slug đã được sử dụng');
      }
      throw error;
    }
  }

  async update(id: bigint, dto: UpdatePostDto) {
    const existing = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    const shouldSetPublishedAt =
      dto.status === 'PUBLISHED' && existing.publishedAt === null;

    const post = await this.prisma.post.update({
      where: { id },
      data: {
        title: dto.title,
        excerpt: dto.excerpt,
        content: dto.content,
        thumbnailUrl: dto.thumbnailUrl,
        status: dto.status,
        ...(shouldSetPublishedAt ? { publishedAt: new Date() } : {}),
      },
    });
    return this.toResponse(post);
  }

  async remove(id: bigint) {
    const existing = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    await this.prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  async listPublished(query: QueryPublicPostDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Prisma.PostWhereInput = {
      status: 'PUBLISHED',
      deletedAt: null,
    };

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id.toString(),
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        thumbnailUrl: item.thumbnailUrl,
        publishedAt: item.publishedAt,
        viewCount: item.viewCount,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getPublishedBySlug(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null },
      include: { author: { select: { fullName: true } } },
    });
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    // Fire-and-forget — a view-counter failure must never break the page.
    void this.prisma.post
      .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => undefined);

    return {
      id: post.id.toString(),
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      thumbnailUrl: post.thumbnailUrl,
      publishedAt: post.publishedAt,
      viewCount: post.viewCount,
      authorName: post.author?.fullName ?? null,
    };
  }

  private toResponse(post: Post) {
    return {
      id: post.id.toString(),
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      thumbnailUrl: post.thumbnailUrl,
      status: post.status,
      authorId: post.authorId?.toString() ?? null,
      viewCount: post.viewCount,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
