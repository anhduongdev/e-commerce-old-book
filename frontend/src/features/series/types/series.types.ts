export interface Series {
  id: string;
  name: string;
  slug: string;
  author: string | null;
  publisher: string | null;
  description: string | null;
  coverUrl: string | null;
  totalVolumes: number | null;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SeriesListResponse {
  items: Series[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SeriesPayload {
  name: string;
  slug?: string; // omitted on update — slug is immutable after creation
  author?: string;
  publisher?: string;
  description?: string;
  coverUrl?: string;
  totalVolumes?: number;
  isActive: boolean;
}
