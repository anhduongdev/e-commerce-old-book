import Link from "next/link";
import { Newspaper } from "lucide-react";
import type { BlogPostSummary } from "@/features/blog/types/blog.types";
import { formatBlogDate } from "@/features/blog/utils/format";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
).replace(/\/api\/?$/, "");

function resolveThumbnailUrl(thumbnailUrl: string) {
  return thumbnailUrl.startsWith("http") ? thumbnailUrl : `${BACKEND_ORIGIN}${thumbnailUrl}`;
}

export function BlogPostCard({ post }: { post: BlogPostSummary }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex aspect-video items-center justify-center overflow-hidden bg-primary-lightest">
        {post.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveThumbnailUrl(post.thumbnailUrl)}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <Newspaper size={32} className="text-text-secondary" aria-hidden="true" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 font-serif font-semibold text-text">{post.title}</p>
        <p className="mt-1.5 line-clamp-2 text-sm text-text-secondary">{post.excerpt}</p>
        <p className="mt-3 text-xs text-text-secondary">{formatBlogDate(post.publishedAt)}</p>
      </div>
    </Link>
  );
}
