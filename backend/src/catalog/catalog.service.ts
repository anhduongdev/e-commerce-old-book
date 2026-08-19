import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { QueryCatalogProductsDto } from './dto/query-catalog-products.dto';

type CatalogProductRow = Prisma.ProductGetPayload<{
  include: {
    series: { select: { id: true; name: true } };
    productCategories: { include: { category: { select: { id: true; name: true } } } };
    variants: true;
    images: true;
  };
}>;
type VariantRow = CatalogProductRow['variants'][number];
type ImageRow = CatalogProductRow['images'][number];

// Detail view always shows every active tập regardless of whatever filters
// the customer arrived through — unlike list(), this include is static.
const CATALOG_DETAIL_INCLUDE = {
  series: { select: { id: true, name: true } },
  productCategories: { include: { category: { select: { id: true, name: true } } } },
  variants: {
    where: { isActive: true, deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { volumeNumber: 'asc' }],
  },
  images: { orderBy: { sortOrder: 'asc' } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryCatalogProductsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const sort = query.sort ?? 'newest';

    // Also drives include.variants.where below — a customer filtering by
    // condition grade should only see the matching tập on the card, not the
    // full set.
    const variantWhere: Prisma.ProductVariantWhereInput = {
      isActive: true,
      deletedAt: null,
      ...(query.conditionGrade ? { conditionGrade: query.conditionGrade } : {}),
    };

    const minPriceFilter: Prisma.BigIntFilter = {};
    if (query.minPrice !== undefined) minPriceFilter.gte = BigInt(query.minPrice);
    if (query.maxPrice !== undefined) minPriceFilter.lte = BigInt(query.maxPrice);

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      status: 'ACTIVE',
      variants: { some: variantWhere },
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search } },
              { author: { contains: query.search } },
              { publisher: { contains: query.search } },
              { shortDescription: { contains: query.search } },
            ],
          }
        : {}),
      ...(query.categoryId
        ? { productCategories: { some: { categoryId: BigInt(query.categoryId) } } }
        : {}),
      ...(query.author ? { author: query.author } : {}),
      ...(query.publisher ? { publisher: query.publisher } : {}),
      ...(Object.keys(minPriceFilter).length > 0 ? { minPrice: minPriceFilter } : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === 'price_asc'
        ? { minPrice: 'asc' }
        : sort === 'price_desc'
          ? { minPrice: 'desc' }
          : { createdAt: 'desc' };

    const include = {
      series: { select: { id: true, name: true } },
      productCategories: { include: { category: { select: { id: true, name: true } } } },
      variants: { where: variantWhere, orderBy: [{ sortOrder: 'asc' }, { volumeNumber: 'asc' }] },
      images: { orderBy: { sortOrder: 'asc' } },
    } satisfies Prisma.ProductInclude;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toListItem(item)),
      total,
      page,
      pageSize,
    };
  }

  async getBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null, status: 'ACTIVE' },
      include: CATALOG_DETAIL_INCLUDE,
    });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    // Fire-and-forget — a view-counter failure must never break the page.
    void this.prisma.product
      .update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => undefined);

    return this.toDetailItem(product);
  }

  async getFilters() {
    const [categories, authorRows, publisherRows, priceAgg] = await Promise.all([
      this.prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, parentId: true },
        orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
      }),
      this.prisma.product.findMany({
        where: { status: 'ACTIVE', deletedAt: null, author: { not: null } },
        distinct: ['author'],
        select: { author: true },
        orderBy: { author: 'asc' },
      }),
      this.prisma.product.findMany({
        where: { status: 'ACTIVE', deletedAt: null, publisher: { not: null } },
        distinct: ['publisher'],
        select: { publisher: true },
        orderBy: { publisher: 'asc' },
      }),
      this.prisma.product.aggregate({
        where: { status: 'ACTIVE', deletedAt: null },
        _min: { minPrice: true },
        _max: { minPrice: true },
      }),
    ]);

    return {
      categories: categories.map((category) => ({
        id: category.id.toString(),
        name: category.name,
        level: category.parentId ? 2 : 1,
        parentId: category.parentId?.toString() ?? null,
      })),
      authors: authorRows.map((row) => row.author).filter((v): v is string => Boolean(v)),
      publishers: publisherRows
        .map((row) => row.publisher)
        .filter((v): v is string => Boolean(v)),
      priceBounds:
        priceAgg._min.minPrice !== null && priceAgg._max.minPrice !== null
          ? { min: priceAgg._min.minPrice.toString(), max: priceAgg._max.minPrice.toString() }
          : null,
    };
  }

  private toListItem(product: CatalogProductRow) {
    const variants = product.variants.map((variant) =>
      this.toVariantSummary(product, variant, product.images),
    );
    const prices = variants.map((v) => BigInt(v.price));
    const minPrice = prices.length > 0 ? prices.reduce((a, b) => (a < b ? a : b)) : 0n;
    const maxPrice = prices.length > 0 ? prices.reduce((a, b) => (a > b ? a : b)) : 0n;

    return {
      id: product.id.toString(),
      name: product.name,
      slug: product.slug,
      author: product.author,
      publisher: product.publisher,
      seriesId: product.seriesId?.toString() ?? null,
      seriesName: product.series?.name ?? null,
      minPrice: minPrice.toString(),
      maxPrice: maxPrice.toString(),
      variantCount: variants.length,
      categories: product.productCategories.map((pc) => ({
        id: pc.category.id.toString(),
        name: pc.category.name,
      })),
      variants,
      createdAt: product.createdAt,
    };
  }

  private toVariantSummary(
    product: CatalogProductRow,
    variant: VariantRow,
    productImages: ImageRow[],
  ) {
    const { url, isRealPhoto } = this.resolveVariantImage(product, variant, productImages);
    return {
      id: variant.id.toString(),
      volumeNumber: variant.volumeNumber,
      name: variant.name,
      price: variant.price.toString(),
      compareAtPrice: variant.compareAtPrice !== null ? variant.compareAtPrice.toString() : null,
      conditionGrade: variant.conditionGrade,
      conditionNote: variant.conditionNote,
      availableQuantity: Math.max(0, variant.stockQuantity - variant.reservedQuantity),
      imageUrl: url,
      isRealPhoto,
    };
  }

  // Priority: the tập's own photo first (most specific to the exact copy
  // being sold), then a variant-scoped real-photo gallery row (schema
  // supports this even though the current admin form never creates one),
  // then a product-level real photo, then any other product image or the
  // denormalized thumbnail, then nothing. Only the first three count as a
  // confirmed real photo — the frontend shows an "Ảnh minh họa" badge
  // whenever isRealPhoto is false but a url is still present.
  private resolveVariantImage(
    product: CatalogProductRow,
    variant: VariantRow,
    productImages: ImageRow[],
  ): { url: string | null; isRealPhoto: boolean } {
    if (variant.imageUrl) {
      return { url: variant.imageUrl, isRealPhoto: true };
    }
    const variantRealPhoto = productImages.find(
      (img) => img.variantId === variant.id && img.isRealPhoto,
    );
    if (variantRealPhoto) {
      return { url: variantRealPhoto.url, isRealPhoto: true };
    }
    const productRealPhoto = productImages.find(
      (img) => img.variantId === null && img.isRealPhoto,
    );
    if (productRealPhoto) {
      return { url: productRealPhoto.url, isRealPhoto: true };
    }
    const anyProductImage = productImages.find((img) => img.variantId === null);
    if (anyProductImage) {
      return { url: anyProductImage.url, isRealPhoto: false };
    }
    if (product.thumbnailUrl) {
      return { url: product.thumbnailUrl, isRealPhoto: false };
    }
    return { url: null, isRealPhoto: false };
  }

  private toDetailItem(product: CatalogProductRow) {
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
      seriesId: product.seriesId?.toString() ?? null,
      seriesName: product.series?.name ?? null,
      categories: product.productCategories.map((pc) => ({
        id: pc.category.id.toString(),
        name: pc.category.name,
      })),
      variants: product.variants.map((variant) =>
        this.toVariantDetail(product, variant, product.images),
      ),
    };
  }

  private toVariantDetail(product: CatalogProductRow, variant: VariantRow, productImages: ImageRow[]) {
    return {
      id: variant.id.toString(),
      volumeNumber: variant.volumeNumber,
      name: variant.name,
      price: variant.price.toString(),
      compareAtPrice: variant.compareAtPrice !== null ? variant.compareAtPrice.toString() : null,
      conditionGrade: variant.conditionGrade,
      conditionNote: variant.conditionNote,
      availableQuantity: Math.max(0, variant.stockQuantity - variant.reservedQuantity),
      images: this.resolveVariantGallery(product, variant, productImages),
    };
  }

  // Fuller than resolveVariantImage (list) — returns the whole gallery for
  // this tập instead of picking just one, for the detail page's viewer:
  // the tập's own photo first, then any images scoped to it, then the
  // shared product-level gallery, falling back to the denormalized
  // thumbnail only if nothing else exists. Deduped by URL.
  private resolveVariantGallery(
    product: CatalogProductRow,
    variant: VariantRow,
    productImages: ImageRow[],
  ): { url: string; isRealPhoto: boolean }[] {
    const gallery: { url: string; isRealPhoto: boolean }[] = [];
    const seen = new Set<string>();
    const push = (url: string | null, isRealPhoto: boolean) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      gallery.push({ url, isRealPhoto });
    };

    push(variant.imageUrl, true);
    productImages
      .filter((img) => img.variantId === variant.id)
      .forEach((img) => push(img.url, img.isRealPhoto));
    productImages
      .filter((img) => img.variantId === null)
      .forEach((img) => push(img.url, img.isRealPhoto));

    if (gallery.length === 0 && product.thumbnailUrl) {
      push(product.thumbnailUrl, false);
    }

    return gallery;
  }
}
