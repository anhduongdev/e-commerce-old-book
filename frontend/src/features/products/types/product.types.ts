export type ProductStatus = "DRAFT" | "ACTIVE" | "HIDDEN";
export type ConditionGrade = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "WORN";

export interface ProductImage {
  id: string;
  variantId: string | null;
  url: string;
  alt: string | null;
  isRealPhoto: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  volumeNumber: number | null;
  name: string | null;
  price: string;
  compareAtPrice: string | null;
  conditionGrade: ConditionGrade;
  conditionNote: string | null;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  weightGram: number | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  images: ProductImage[];
}

export interface ProductCategoryRef {
  id: string;
  name: string;
  slug: string;
  isPrimary: boolean;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  author: string | null;
  publisher: string | null;
  thumbnailUrl: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  minPrice: string | null;
  totalStock: number;
  variantCount: number;
  seriesId: string | null;
  seriesName: string | null;
  categories: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail extends ProductListItem {
  publishYear: number | null;
  isbn: string | null;
  language: string | null;
  shortDescription: string | null;
  description: string | null;
  soldCount: number;
  viewCount: number;
  publishedAt: string | null;
  variants: ProductVariant[];
  images: ProductImage[];
  categories: ProductCategoryRef[];
  primaryCategoryId: string | null;
}

export interface ProductListResponse {
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductVariantPayload {
  id?: string;
  tempKey?: string;
  sku: string;
  volumeNumber?: number;
  name?: string;
  price: number;
  compareAtPrice?: number;
  conditionGrade: ConditionGrade;
  conditionNote?: string;
  stockQuantity: number;
  weightGram?: number;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductImagePayload {
  id?: string;
  url: string;
  alt?: string;
  variantId?: string;
  variantTempKey?: string;
  isRealPhoto: boolean;
  sortOrder: number;
}

export interface ProductPayload {
  name: string;
  slug?: string; // omitted on update — slug is immutable after creation
  seriesId?: string | null;
  author?: string;
  publisher?: string;
  publishYear?: number;
  isbn?: string;
  language?: string;
  shortDescription?: string;
  description?: string;
  thumbnailUrl?: string;
  status: ProductStatus;
  isFeatured: boolean;
  variants: ProductVariantPayload[];
  images: ProductImagePayload[];
  categoryIds: string[];
  primaryCategoryId: string;
}
