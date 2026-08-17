import type { Metadata } from "next";
import { CategoryFormPage } from "@/features/categories/components/CategoryFormPage";

export const metadata: Metadata = {
  title: "Chỉnh sửa danh mục",
  robots: { index: false, follow: false },
};

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CategoryFormPage mode="edit" categoryId={id} />;
}
