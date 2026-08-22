"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { BlogPostSummary } from "@/features/blog/types/blog.types";
import { BlogPostCard } from "@/features/blog/components/BlogPostCard";
import { Pagination } from "@/features/catalog/components/Pagination";

export function BlogList({
  items,
  total,
  page,
  pageSize,
}: {
  items: BlogPostSummary[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(nextPage));
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-16 text-center text-sm text-text-secondary shadow-sm">
        Chưa có bài viết nào.
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
      <div className="mt-6">
        <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
      </div>
    </div>
  );
}
