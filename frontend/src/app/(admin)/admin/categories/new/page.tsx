import type { Metadata } from "next";
import { CategoryFormPage } from "@/features/categories/components/CategoryFormPage";

export const metadata: Metadata = {
  title: "Tạo danh mục mới",
  robots: { index: false, follow: false },
};

export default function NewCategoryPage() {
  return <CategoryFormPage mode="create" />;
}
