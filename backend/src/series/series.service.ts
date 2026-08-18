import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { QuerySeriesDto } from './dto/query-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';

const SERIES_INCLUDE = {
  _count: { select: { products: true } },
} satisfies Prisma.SeriesInclude;

type SeriesWithRelations = Prisma.SeriesGetPayload<{
  include: typeof SERIES_INCLUDE;
}>;

@Injectable()
export class SeriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QuerySeriesDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Prisma.SeriesWhereInput = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search } },
              { slug: { contains: query.search } },
              { author: { contains: query.search } },
              { publisher: { contains: query.search } },
            ],
          }
        : {}),
      ...(query.isActive !== undefined
        ? { isActive: query.isActive === 'true' }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.series.findMany({
        where,
        include: SERIES_INCLUDE,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.series.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: bigint) {
    const series = await this.prisma.series.findFirst({
      where: { id, deletedAt: null },
      include: SERIES_INCLUDE,
    });
    if (!series) {
      throw new NotFoundException('Không tìm thấy bộ truyện');
    }
    return this.toResponse(series);
  }

  async create(dto: CreateSeriesDto) {
    try {
      const series = await this.prisma.series.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          author: dto.author,
          publisher: dto.publisher,
          description: dto.description,
          coverUrl: dto.coverUrl,
          totalVolumes: dto.totalVolumes,
          isActive: dto.isActive,
        },
        include: SERIES_INCLUDE,
      });
      return this.toResponse(series);
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

  async update(id: bigint, dto: UpdateSeriesDto) {
    const existing = await this.prisma.series.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy bộ truyện');
    }

    const series = await this.prisma.series.update({
      where: { id },
      data: {
        name: dto.name,
        author: dto.author,
        publisher: dto.publisher,
        description: dto.description,
        coverUrl: dto.coverUrl,
        totalVolumes: dto.totalVolumes,
        isActive: dto.isActive,
      },
      include: SERIES_INCLUDE,
    });
    return this.toResponse(series);
  }

  async remove(id: bigint) {
    const existing = await this.prisma.series.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy bộ truyện');
    }

    // Soft-delete (Series has deletedAt, unlike Category) — old orders/products
    // must keep their historical reference to the series row. Soft-deleting
    // alone does NOT trigger the FK's ON DELETE SET NULL (that only fires on a
    // real DELETE), so we explicitly unlink products in the same transaction
    // to keep the "products lose their link" promise made in the confirm modal
    // actually true.
    await this.prisma.$transaction([
      this.prisma.product.updateMany({
        where: { seriesId: id },
        data: { seriesId: null },
      }),
      this.prisma.series.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);
    return { success: true };
  }

  private toResponse(series: SeriesWithRelations) {
    return {
      id: series.id.toString(),
      name: series.name,
      slug: series.slug,
      author: series.author,
      publisher: series.publisher,
      description: series.description,
      coverUrl: series.coverUrl,
      totalVolumes: series.totalVolumes,
      isActive: series.isActive,
      productCount: series._count.products,
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
    };
  }
}
