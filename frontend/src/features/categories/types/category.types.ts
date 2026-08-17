export interface Category {
  id: string;
  name: string;
  slug: string;
  level: 1 | 2;
  parentId: string | null;
  parentName: string | null;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  searchKeywords: string[] | null;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  items: Category[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CategoryPayload {
  name: string;
  slug?: string; // omitted on update — slug is immutable after creation
  parentId?: string | null;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  searchKeywords?: string[];
}

export interface ReorderItem {
  id: string;
  sortOrder: number;
}
