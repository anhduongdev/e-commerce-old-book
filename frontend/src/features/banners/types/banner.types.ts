export type BannerPosition = "HOME_HERO" | "HOME_SUB" | "SIDEBAR";

export interface Banner {
  id: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
  position: BannerPosition;
  sortOrder: number;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BannerListResponse {
  items: Banner[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BannerPayload {
  title?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  position: BannerPosition;
  sortOrder: number;
  isActive: boolean;
  startAt?: string | null;
  endAt?: string | null;
}

export interface ReorderItem {
  id: string;
  sortOrder: number;
}
