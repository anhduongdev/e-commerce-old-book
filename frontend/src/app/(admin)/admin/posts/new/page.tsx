import type { Metadata } from "next";
import { PostFormPage } from "@/features/posts/components/PostFormPage";

export const metadata: Metadata = {
  title: "Viết bài mới",
  robots: { index: false, follow: false },
};

export default function NewPostPage() {
  return <PostFormPage mode="create" />;
}
