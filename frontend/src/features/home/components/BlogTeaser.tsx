import type { BlogPostSummary } from "@/features/blog/types/blog.types";
import { BlogPostCard } from "@/features/blog/components/BlogPostCard";

export function BlogTeaser({ posts }: { posts: BlogPostSummary[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {posts.map((post) => (
        <BlogPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
