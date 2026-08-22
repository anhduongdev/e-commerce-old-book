import Link from "next/link";
import type { BlogPostDetail } from "@/features/blog/types/blog.types";
import { formatBlogDate } from "@/features/blog/utils/format";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
).replace(/\/api\/?$/, "");

function resolveThumbnailUrl(thumbnailUrl: string) {
  return thumbnailUrl.startsWith("http") ? thumbnailUrl : `${BACKEND_ORIGIN}${thumbnailUrl}`;
}

export function BlogPostContent({ post }: { post: BlogPostDetail }) {
  const meta = [post.authorName, formatBlogDate(post.publishedAt), `${post.viewCount} lượt xem`]
    .filter(Boolean)
    .join(" · ");

  const paragraphs = post.content.split(/\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-6 text-sm text-text-secondary">
        <Link href="/" className="hover:text-text">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-text">
          Blog
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text">{post.title}</span>
      </nav>

      {post.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolveThumbnailUrl(post.thumbnailUrl)}
          alt=""
          className="mb-6 aspect-video w-full rounded-2xl object-cover"
        />
      ) : null}

      <h1 className="font-serif text-3xl font-bold text-text">{post.title}</h1>
      <p className="mt-2 text-sm text-text-secondary">{meta}</p>

      <div className="mt-6 space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="text-text-secondary leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
