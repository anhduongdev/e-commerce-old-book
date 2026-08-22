export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  metaDescription: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PageListResponse {
  items: Page[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PagePayload {
  title: string;
  slug: string; // required on create — slug is immutable after creation
  content?: string;
  metaDescription?: string;
  isActive: boolean;
}

export type PageUpdatePayload = Omit<PagePayload, "slug">;
