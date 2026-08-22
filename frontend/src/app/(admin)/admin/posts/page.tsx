import type { Metadata } from "next";
import { PostListPage } from "@/features/posts/components/PostListPage";

export const metadata: Metadata = {
  title: "Quản lý bài viết",
  robots: { index: false, follow: false },
};

export default function AdminPostsPage() {
  return <PostListPage />;
}
