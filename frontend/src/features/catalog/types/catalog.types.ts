import type { ConditionGrade } from "@/features/products/types/product.types";

export type CatalogSort = "newest" | "price_asc" | "price_desc";

export interface CatalogVariant {
  id: string;
  volumeNumber: number | null;
  name: string | null;
  price: string;
  compareAtPrice: string | null;
  conditionGrade: ConditionGrade;
  conditionNote: string | null;
  availableQuantity: number;
  imageUrl: string | null;
  isRealPhoto: boolean;
}

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  author: string | null;
  publisher: string | null;
  seriesId: string | null;
  seriesName: string | null;
  minPrice: string;
  maxPrice: string;
  variantCount: number;
  categories: { id: string; name: string }[];
  variants: CatalogVariant[];
  createdAt: string;
}

export interface CatalogProductListResponse {
  items: CatalogProduct[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CatalogCategory {
  id: string;
  name: string;
  level: 1 | 2;
  parentId: string | null;
}

export interface CatalogFilters {
  categories: CatalogCategory[];
  authors: string[];
  publishers: string[];
  priceBounds: { min: string; max: string } | null;
}
