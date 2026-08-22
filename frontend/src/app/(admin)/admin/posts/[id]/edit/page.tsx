import type { Metadata } from "next";
import { PostFormPage } from "@/features/posts/components/PostFormPage";

export const metadata: Metadata = {
  title: "Chỉnh sửa bài viết",
  robots: { index: false, follow: false },
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PostFormPage mode="edit" postId={id} />;
}
