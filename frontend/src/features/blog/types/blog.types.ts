export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  viewCount: number;
}

export interface BlogPostDetail extends BlogPostSummary {
  content: string;
  authorName: string | null;
}

export interface BlogPostListResponse {
  items: BlogPostSummary[];
  total: number;
  page: number;
  pageSize: number;
}
