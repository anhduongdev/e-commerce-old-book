import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Page } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { QueryPageDto } from './dto/query-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryPageDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Prisma.PageWhereInput = {
      ...(query.search
        ? {
            title: { contains: query.search },
          }
        : {}),
      ...(query.isActive !== undefined
        ? { isActive: query.isActive === 'true' }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.page.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.page.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: bigint) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) {
      throw new NotFoundException('Không tìm thấy trang');
    }
    return this.toResponse(page);
  }

  async create(dto: CreatePageDto) {
    try {
      const page = await this.prisma.page.create({
        data: {
          title: dto.title,
          slug: dto.slug,
          content: dto.content,
          metaDescription: dto.metaDescription,
          isActive: dto.isActive,
        },
      });
      return this.toResponse(page);
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

  async update(id: bigint, dto: UpdatePageDto) {
    const existing = await this.prisma.page.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy trang');
    }

    try {
      const page = await this.prisma.page.update({
        where: { id },
        data: {
          title: dto.title,
          content: dto.content,
          metaDescription: dto.metaDescription,
          isActive: dto.isActive,
        },
      });
      return this.toResponse(page);
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

  async remove(id: bigint) {
    const existing = await this.prisma.page.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy trang');
    }

    await this.prisma.page.delete({ where: { id } });
    return { success: true };
  }

  async getPublicBySlug(slug: string) {
    const page = await this.prisma.page.findFirst({
      where: { slug, isActive: true },
    });
    if (!page) {
      throw new NotFoundException('Không tìm thấy trang');
    }
    return {
      id: page.id.toString(),
      title: page.title,
      slug: page.slug,
      content: page.content,
      metaDescription: page.metaDescription,
    };
  }

  private toResponse(page: Page) {
    return {
      id: page.id.toString(),
      title: page.title,
      slug: page.slug,
      content: page.content,
      metaDescription: page.metaDescription,
      isActive: page.isActive,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }
}
