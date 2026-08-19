import type { Metadata } from "next";
import { ProductListPage } from "@/features/products/components/ProductListPage";

export const metadata: Metadata = {
  title: "Quản lý sản phẩm",
  robots: { index: false, follow: false },
};

export default function AdminProductsPage() {
  return <ProductListPage />;
}
