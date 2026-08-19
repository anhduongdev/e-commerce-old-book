import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductImageDto } from './dto/product-image.dto';
import { ProductVariantDto } from './dto/product-variant.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const PRODUCT_LIST_INCLUDE = {
  series: { select: { id: true, name: true } },
  productCategories: { include: { category: { select: { id: true, name: true } } } },
  _count: { select: { variants: { where: { deletedAt: null } } } },
} satisfies Prisma.ProductInclude;

const PRODUCT_DETAIL_INCLUDE = {
  series: { select: { id: true, name: true, slug: true } },
  variants: {
    where: { deletedAt: null },
    orderBy: [{ volumeNumber: 'asc' }, { sortOrder: 'asc' }],
    include: { images: { orderBy: { sortOrder: 'asc' } } },
  },
  images: { where: { variantId: null }, orderBy: { sortOrder: 'asc' } },
  productCategories: {
    include: { category: { select: { id: true, name: true, slug: true } } },
  },
} satisfies Prisma.ProductInclude;

type ProductListItem = Prisma.ProductGetPayload<{ include: typeof PRODUCT_LIST_INCLUDE }>;
type ProductDetailItem = Prisma.ProductGetPayload<{ include: typeof PRODUCT_DETAIL_INCLUDE }>;
type ImageRow = {
  id: bigint;
  variantId: bigint | null;
  url: string;
  alt: string | null;
  isRealPhoto: boolean;
  sortOrder: number;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryProductDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search } },
              { slug: { contains: query.search } },
              { author: { contains: query.search } },
              { publisher: { contains: query.search } },
              { isbn: { contains: query.search } },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.seriesId ? { seriesId: BigInt(query.seriesId) } : {}),
      ...(query.categoryId
        ? { productCategories: { some: { categoryId: BigInt(query.categoryId) } } }
        : {}),
      ...(query.outOfStock !== undefined
        ? { totalStock: query.outOfStock === 'true' ? 0 : { gt: 0 } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_LIST_INCLUDE,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toListResponse(item)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: bigint) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: PRODUCT_DETAIL_INCLUDE,
    });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    return this.toDetailResponse(product);
  }

  async create(dto: CreateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      this.validateVariantSet(dto.variants);
      this.validateCategorySelection(dto.categoryIds, dto.primaryCategoryId);
      await this.assertCategoriesExist(tx, dto.categoryIds);

      let seriesId: bigint | null = null;
      if (dto.seriesId) {
        seriesId = await this.resolveSeriesId(tx, dto.seriesId);
      }

      const { minPrice, totalStock } = this.computeDenormalized(dto.variants);

      let product: { id: bigint };
      try {
        product = await tx.product.create({
          data: {
            name: dto.name,
            slug: dto.slug,
            seriesId,
            author: dto.author,
            publisher: dto.publisher,
            publishYear: dto.publishYear,
            isbn: dto.isbn,
            language: dto.language,
            shortDescription: dto.shortDescription,
            description: dto.description,
            thumbnailUrl: this.deriveThumbnail(dto),
            status: dto.status,
            isFeatured: dto.isFeatured,
            minPrice,
            totalStock,
          },
        });
      } catch (error) {
        throw this.translateWriteError(error);
      }

      const tempKeyMap = new Map<string, bigint>();
      try {
        for (const variant of dto.variants) {
          const created = await tx.productVariant.create({
            data: { ...this.variantData(variant), productId: product.id },
          });
          if (variant.tempKey) tempKeyMap.set(variant.tempKey, created.id);
        }
      } catch (error) {
        throw this.translateWriteError(error);
      }

      for (const image of dto.images ?? []) {
        await tx.productImage.create({
          data: {
            productId: product.id,
            ...this.imageData(image, tempKeyMap),
          },
        });
      }

      for (const categoryId of dto.categoryIds) {
        await tx.productCategory.create({
          data: {
            productId: product.id,
            categoryId: BigInt(categoryId),
            isPrimary: categoryId === dto.primaryCategoryId,
          },
        });
      }

      return this.toDetailResponse(await this.loadDetail(tx, product.id));
    });
  }

  async update(id: bigint, dto: UpdateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.product.findFirst({
        where: { id, deletedAt: null },
        include: { variants: { where: { deletedAt: null } } },
      });
      if (!existing) {
        throw new NotFoundException('Không tìm thấy sản phẩm');
      }

      this.validateVariantSet(dto.variants);
      this.validateCategorySelection(dto.categoryIds, dto.primaryCategoryId);
      await this.assertCategoriesExist(tx, dto.categoryIds);

      let seriesId: bigint | null = null;
      if (dto.seriesId) {
        seriesId = await this.resolveSeriesId(tx, dto.seriesId);
      }

      // Variants: diff by id — never delete-and-recreate, because
      // CartItem/OrderItem/StockReservation reference variantId and a hard
      // replace would orphan those references even though the FK itself
      // survives via onDelete: SetNull. Rows dropped from the payload are
      // soft-deleted instead.
      const tempKeyMap = new Map<string, bigint>();
      const keptVariantIds = new Set<bigint>();

      try {
        for (const variant of dto.variants) {
          if (variant.id) {
            const variantId = BigInt(variant.id);
            if (!existing.variants.some((v) => v.id === variantId)) {
              throw new BadRequestException('Tập không thuộc về sản phẩm này');
            }
            await tx.productVariant.update({
              where: { id: variantId },
              data: this.variantData(variant),
            });
            keptVariantIds.add(variantId);
            if (variant.tempKey) tempKeyMap.set(variant.tempKey, variantId);
          } else {
            const created = await tx.productVariant.create({
              data: { ...this.variantData(variant), productId: id },
            });
            if (variant.tempKey) tempKeyMap.set(variant.tempKey, created.id);
          }
        }
      } catch (error) {
        throw this.translateWriteError(error);
      }

      const removedVariantIds = existing.variants
        .map((v) => v.id)
        .filter((variantId) => !keptVariantIds.has(variantId));
      if (removedVariantIds.length > 0) {
        await tx.productVariant.updateMany({
          where: { id: { in: removedVariantIds } },
          data: { deletedAt: new Date() },
        });
      }

      // Images/categories: no downstream FK references these rows' identity,
      // so a full replace-all is simpler and safe (unlike variants above).
      await tx.productImage.deleteMany({ where: { productId: id } });
      for (const image of dto.images ?? []) {
        await tx.productImage.create({
          data: {
            productId: id,
            ...this.imageData(image, tempKeyMap),
          },
        });
      }

      await tx.productCategory.deleteMany({ where: { productId: id } });
      for (const categoryId of dto.categoryIds) {
        await tx.productCategory.create({
          data: {
            productId: id,
            categoryId: BigInt(categoryId),
            isPrimary: categoryId === dto.primaryCategoryId,
          },
        });
      }

      const { minPrice, totalStock } = this.computeDenormalized(dto.variants);

      try {
        await tx.product.update({
          where: { id },
          data: {
            name: dto.name,
            seriesId,
            author: dto.author,
            publisher: dto.publisher,
            publishYear: dto.publishYear,
            isbn: dto.isbn,
            language: dto.language,
            shortDescription: dto.shortDescription,
            description: dto.description,
            thumbnailUrl: this.deriveThumbnail(dto),
            status: dto.status,
            isFeatured: dto.isFeatured,
            minPrice,
            totalStock,
          },
        });
      } catch (error) {
        throw this.translateWriteError(error);
      }

      return this.toDetailResponse(await this.loadDetail(tx, id));
    });
  }

  async remove(id: bigint) {
    const existing = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    // Soft-delete only — never hard-delete. OrderItem/CartItem/StockReservation
    // reference variantId, and onDelete: SetNull only protects the DB from FK
    // errors, not order history from losing its product name. Prisma's
    // onDelete: Cascade (Product -> ProductVariant) also only fires on a real
    // relational delete, never on this soft-delete UPDATE, so variants must be
    // cascaded by hand in the same transaction — mirrors SeriesService.remove.
    await this.prisma.$transaction([
      this.prisma.productVariant.updateMany({
        where: { productId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      this.prisma.product.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);
    return { success: true };
  }

  private variantData(variant: ProductVariantDto) {
    return {
      sku: variant.sku,
      volumeNumber: variant.volumeNumber ?? null,
      name: variant.name ?? null,
      price: BigInt(variant.price),
      compareAtPrice:
        variant.compareAtPrice !== undefined ? BigInt(variant.compareAtPrice) : null,
      conditionGrade: variant.conditionGrade,
      conditionNote: variant.conditionNote ?? null,
      stockQuantity: variant.stockQuantity,
      weightGram: variant.weightGram ?? null,
      imageUrl: variant.imageUrl ?? null,
      isActive: variant.isActive,
      sortOrder: variant.sortOrder,
    };
  }

  private imageData(image: ProductImageDto, tempKeyMap: Map<string, bigint>) {
    return {
      variantId: this.resolveImageVariantId(image, tempKeyMap),
      url: image.url,
      alt: image.alt,
      isRealPhoto: image.isRealPhoto,
      sortOrder: image.sortOrder,
    };
  }

  private resolveImageVariantId(
    image: ProductImageDto,
    tempKeyMap: Map<string, bigint>,
  ): bigint | null {
    if (image.variantId) {
      return BigInt(image.variantId);
    }
    if (image.variantTempKey) {
      const resolved = tempKeyMap.get(image.variantTempKey);
      if (!resolved) {
        throw new BadRequestException(
          'Ảnh tham chiếu tới một tập không tồn tại trong yêu cầu này',
        );
      }
      return resolved;
    }
    return null;
  }

  private validateVariantSet(variants: ProductVariantDto[]) {
    if (variants.length === 0) {
      throw new BadRequestException('Sản phẩm phải có ít nhất một tập/phiên bản');
    }

    const skuSeen = new Set<string>();
    const volumeSeen = new Set<number | 'standalone'>();
    for (const variant of variants) {
      if (skuSeen.has(variant.sku)) {
        throw new BadRequestException(`SKU "${variant.sku}" bị trùng trong danh sách tập`);
      }
      skuSeen.add(variant.sku);

      const volumeKey = variant.volumeNumber ?? 'standalone';
      if (volumeSeen.has(volumeKey)) {
        throw new BadRequestException(
          variant.volumeNumber
            ? `Tập số ${variant.volumeNumber} bị trùng`
            : 'Chỉ được có một phiên bản không đánh số tập (sách lẻ) trên mỗi sản phẩm',
        );
      }
      volumeSeen.add(volumeKey);
    }
  }

  private validateCategorySelection(categoryIds: string[], primaryCategoryId: string) {
    if (!categoryIds.includes(primaryCategoryId)) {
      throw new BadRequestException(
        'Danh mục chính phải nằm trong danh sách danh mục đã chọn',
      );
    }
  }

  private async assertCategoriesExist(tx: Prisma.TransactionClient, categoryIds: string[]) {
    const ids = categoryIds.map((id) => BigInt(id));
    const count = await tx.category.count({ where: { id: { in: ids } } });
    if (count !== ids.length) {
      throw new BadRequestException('Một hoặc nhiều danh mục không tồn tại');
    }
  }

  private async resolveSeriesId(
    tx: Prisma.TransactionClient,
    seriesId: string,
  ): Promise<bigint> {
    const id = BigInt(seriesId);
    const series = await tx.series.findFirst({ where: { id, deletedAt: null } });
    if (!series) {
      throw new BadRequestException('Bộ truyện không tồn tại');
    }
    return id;
  }

  private computeDenormalized(variants: { price: number; stockQuantity: number }[]) {
    const minPrice =
      variants.length > 0 ? BigInt(Math.min(...variants.map((v) => v.price))) : null;
    const totalStock = variants.reduce((sum, v) => sum + v.stockQuantity, 0);
    return { minPrice, totalStock };
  }

  private deriveThumbnail(dto: {
    thumbnailUrl?: string;
    images?: ProductImageDto[];
    variants: ProductVariantDto[];
  }): string | undefined {
    if (dto.thumbnailUrl) return dto.thumbnailUrl;
    const productImages = (dto.images ?? []).filter(
      (image) => !image.variantId && !image.variantTempKey,
    );
    const preferred = productImages.find((image) => image.isRealPhoto) ?? productImages[0];
    if (preferred) return preferred.url;
    return dto.variants.find((variant) => variant.imageUrl)?.imageUrl;
  }

  private loadDetail(tx: Prisma.TransactionClient, id: bigint) {
    return tx.product.findUniqueOrThrow({
      where: { id },
      include: PRODUCT_DETAIL_INCLUDE,
    });
  }

  private translateWriteError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target)
        ? (error.meta.target as string[]).join(',')
        : String(error.meta?.target ?? '');
      if (target.includes('sku')) {
        return new ConflictException('Mã SKU đã được sử dụng');
      }
      return new ConflictException('Slug đã được sử dụng');
    }
    return error;
  }

  private toListResponse(product: ProductListItem) {
    return {
      id: product.id.toString(),
      name: product.name,
      slug: product.slug,
      author: product.author,
      publisher: product.publisher,
      thumbnailUrl: product.thumbnailUrl,
      status: product.status,
      isFeatured: product.isFeatured,
      minPrice: product.minPrice !== null ? product.minPrice.toString() : null,
      totalStock: product.totalStock,
      variantCount: product._count.variants,
      seriesId: product.seriesId?.toString() ?? null,
      seriesName: product.series?.name ?? null,
      categories: product.productCategories.map((pc) => ({
        id: pc.category.id.toString(),
        name: pc.category.name,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private toDetailResponse(product: ProductDetailItem) {
    const primaryCategory = product.productCategories.find((pc) => pc.isPrimary);
    return {
      id: product.id.toString(),
      name: product.name,
      slug: product.slug,
      author: product.author,
      publisher: product.publisher,
      publishYear: product.publishYear,
      isbn: product.isbn,
      language: product.language,
      shortDescription: product.shortDescription,
      description: product.description,
      thumbnailUrl: product.thumbnailUrl,
      minPrice: product.minPrice !== null ? product.minPrice.toString() : null,
      totalStock: product.totalStock,
      status: product.status,
      isFeatured: product.isFeatured,
      soldCount: product.soldCount,
      viewCount: product.viewCount,
      publishedAt: product.publishedAt,
      seriesId: product.seriesId?.toString() ?? null,
      seriesName: product.series?.name ?? null,
      variants: product.variants.map((variant) => ({
        id: variant.id.toString(),
        sku: variant.sku,
        volumeNumber: variant.volumeNumber,
        name: variant.name,
        price: variant.price.toString(),
        compareAtPrice:
          variant.compareAtPrice !== null ? variant.compareAtPrice.toString() : null,
        conditionGrade: variant.conditionGrade,
        conditionNote: variant.conditionNote,
        stockQuantity: variant.stockQuantity,
        reservedQuantity: variant.reservedQuantity,
        availableQuantity: variant.stockQuantity - variant.reservedQuantity,
        weightGram: variant.weightGram,
        imageUrl: variant.imageUrl,
        isActive: variant.isActive,
        sortOrder: variant.sortOrder,
        images: variant.images.map((image) => this.toImageResponse(image)),
      })),
      images: product.images.map((image) => this.toImageResponse(image)),
      categories: product.productCategories.map((pc) => ({
        id: pc.category.id.toString(),
        name: pc.category.name,
        slug: pc.category.slug,
        isPrimary: pc.isPrimary,
      })),
      primaryCategoryId: primaryCategory ? primaryCategory.category.id.toString() : null,
      variantCount: product.variants.length,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private toImageResponse(image: ImageRow) {
    return {
      id: image.id.toString(),
      variantId: image.variantId?.toString() ?? null,
      url: image.url,
      alt: image.alt,
      isRealPhoto: image.isRealPhoto,
      sortOrder: image.sortOrder,
    };
  }
}
