import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogProductBySlug } from "@/features/catalog/services/catalog";
import { ProductDetail } from "@/features/catalog/components/ProductDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);
  return { title: product?.name ?? "Sản phẩm" };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);
  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 text-sm text-brand-600">
        <Link href="/" className="hover:text-brand-900">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <Link href="/san-pham" className="hover:text-brand-900">
          Sản phẩm
        </Link>
        <span className="mx-2">/</span>
        <span className="text-brand-900">{product.name}</span>
      </nav>

      <ProductDetail product={product} />
    </div>
  );
}
