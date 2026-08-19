import type { Metadata } from "next";
import { ProductFormPage } from "@/features/products/components/ProductFormPage";

export const metadata: Metadata = {
  title: "Tạo sản phẩm mới",
  robots: { index: false, follow: false },
};

export default function NewProductPage() {
  return <ProductFormPage mode="create" />;
}
