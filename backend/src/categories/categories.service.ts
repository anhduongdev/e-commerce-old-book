import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const CATEGORY_INCLUDE = {
  parent: { select: { name: true } },
  _count: { select: { productCategories: true } },
} satisfies Prisma.CategoryInclude;

type CategoryWithRelations = Prisma.CategoryGetPayload<{
  include: typeof CATEGORY_INCLUDE;
}>;

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryCategoryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Prisma.CategoryWhereInput = {
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search } },
              { slug: { contains: query.search } },
            ],
          }
        : {}),
      ...(query.isActive !== undefined
        ? { isActive: query.isActive === 'true' }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        include: CATEGORY_INCLUDE,
        orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: bigint) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: CATEGORY_INCLUDE,
    });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    return this.toResponse(category);
  }

  async create(dto: CreateCategoryDto) {
    const parentId = await this.resolveParentId(dto.parentId);

    try {
      const category = await this.prisma.category.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          parentId,
          description: dto.description,
          imageUrl: dto.imageUrl,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
          isFeatured: dto.isFeatured,
          searchKeywords: dto.searchKeywords ?? Prisma.JsonNull,
        },
        include: CATEGORY_INCLUDE,
      });
      return this.toResponse(category);
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

  async update(id: bigint, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    let parentId: bigint | null | undefined;
    if (dto.parentId !== undefined) {
      parentId = await this.resolveParentId(dto.parentId);
      if (parentId === id) {
        throw new BadRequestException('Danh mục không thể là cha của chính nó');
      }
      if (parentId !== null) {
        const children = await this.prisma.category.findMany({
          where: { parentId: id },
          select: { id: true },
        });
        if (children.some((child) => child.id === parentId)) {
          throw new BadRequestException(
            'Không thể chọn danh mục con làm danh mục cha',
          );
        }
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        parentId,
        description: dto.description,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
        isFeatured: dto.isFeatured,
        searchKeywords: dto.searchKeywords,
      },
      include: CATEGORY_INCLUDE,
    });
    return this.toResponse(category);
  }

  async remove(id: bigint) {
    const childCount = await this.prisma.category.count({
      where: { parentId: id },
    });
    if (childCount > 0) {
      throw new ConflictException(
        'Không thể xóa danh mục còn danh mục con — hãy xóa hoặc chuyển danh mục con trước.',
      );
    }

    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  async reorder(dto: ReorderCategoriesDto) {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.category.update({
          where: { id: BigInt(item.id) },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
    return { success: true };
  }

  private async resolveParentId(parentId?: string): Promise<bigint | null> {
    if (!parentId) {
      return null;
    }

    const parent = await this.prisma.category.findUnique({
      where: { id: BigInt(parentId) },
    });
    if (!parent) {
      throw new BadRequestException('Danh mục cha không tồn tại');
    }
    if (parent.parentId !== null) {
      throw new BadRequestException('Danh mục tối đa 2 cấp');
    }
    return parent.id;
  }

  private toResponse(category: CategoryWithRelations) {
    return {
      id: category.id.toString(),
      name: category.name,
      slug: category.slug,
      level: category.parentId ? 2 : 1,
      parentId: category.parentId?.toString() ?? null,
      parentName: category.parent?.name ?? null,
      description: category.description,
      imageUrl: category.imageUrl,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      isFeatured: category.isFeatured,
      searchKeywords: category.searchKeywords,
      productCount: category._count.productCategories,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
