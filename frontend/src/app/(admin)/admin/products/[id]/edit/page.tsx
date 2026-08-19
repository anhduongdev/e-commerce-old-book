import type { Metadata } from "next";
import { ProductFormPage } from "@/features/products/components/ProductFormPage";

export const metadata: Metadata = {
  title: "Cập nhật sản phẩm",
  robots: { index: false, follow: false },
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductFormPage mode="edit" productId={id} />;
}
