import type { Metadata } from "next";
import { CategoryListPage } from "@/features/categories/components/CategoryListPage";

export const metadata: Metadata = {
  title: "Quản lý danh mục",
  robots: { index: false, follow: false },
};

export default function AdminCategoriesPage() {
  return <CategoryListPage />;
}
