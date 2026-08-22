import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogSeriesBySlug, listCatalogProducts } from "@/features/catalog/services/catalog";
import { ProductGrid } from "@/features/catalog/components/ProductGrid";
import { SeriesDetailHeader } from "@/features/series/components/SeriesDetailHeader";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const series = await getCatalogSeriesBySlug(slug);
  return {
    title: series?.name ?? "Bộ truyện",
    description: series?.description ?? undefined,
  };
}

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const series = await getCatalogSeriesBySlug(slug);
  if (!series) {
    notFound();
  }

  const volumes = await listCatalogProducts({
    seriesId: series.id,
    sort: "newest",
    pageSize: 100,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 text-sm text-text-secondary">
        <Link href="/" className="hover:text-text">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <Link href="/bo-truyen" className="hover:text-text">
          Bộ truyện
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text">{series.name}</span>
      </nav>

      <SeriesDetailHeader series={series} />

      <h2 className="mb-4 mt-10 font-serif text-xl font-bold text-text">Các tập đang bán</h2>

      {volumes.items.length === 0 ? (
        <div className="rounded-2xl bg-white p-16 text-center text-sm text-text-secondary shadow-sm">
          Chưa có tập nào đang bán
        </div>
      ) : (
        <ProductGrid products={volumes.items} />
      )}
    </div>
  );
}
