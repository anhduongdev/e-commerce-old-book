import type { Metadata } from "next";
import { listBlogPosts } from "@/features/blog/services/blog";
import { BlogList } from "@/features/blog/components/BlogList";

export const metadata: Metadata = {
  title: "Blog",
};

const PAGE_SIZE = 10;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageRaw } = await searchParams;
  const page = pageRaw ? Math.max(1, Number(pageRaw)) : 1;

  const result = await listBlogPosts({ page, pageSize: PAGE_SIZE });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 font-serif text-2xl font-bold text-text">Blog</h1>
      <BlogList
        items={result.items}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
