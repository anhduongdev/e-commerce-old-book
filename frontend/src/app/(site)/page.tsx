import Link from "next/link";
import {
  getCatalogBanners,
  getCatalogCategories,
  getCatalogSeries,
  listCatalogProducts,
} from "@/features/catalog/services/catalog";
import { listBlogPosts } from "@/features/blog/services/blog";
import { HeroBannerCarousel } from "@/features/home/components/HeroBannerCarousel";
import { CategoryShowcase } from "@/features/home/components/CategoryShowcase";
import { SeriesRail } from "@/features/home/components/SeriesRail";
import { NewArrivalsSection } from "@/features/home/components/NewArrivalsSection";
import { ConditionTrustSection } from "@/features/home/components/ConditionTrustSection";
import { BlogTeaser } from "@/features/home/components/BlogTeaser";
import type {
  CatalogBanner,
  CatalogCategoryNode,
  CatalogProduct,
  CatalogSeries,
} from "@/features/catalog/types/catalog.types";
import type { BlogPostSummary } from "@/features/blog/types/blog.types";

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export default async function Home() {
  const [banners, featuredCategories, categoryTree, series, newArrivals, blogPosts] =
    await Promise.all([
      safe<CatalogBanner[]>(getCatalogBanners("HOME_HERO"), []),
      safe<CatalogCategoryNode[]>(getCatalogCategories(true), []),
      safe<CatalogCategoryNode[]>(getCatalogCategories(false), []),
      safe<CatalogSeries[]>(getCatalogSeries(8), []),
      safe<CatalogProduct[]>(
        listCatalogProducts({ sort: "newest", pageSize: 8 }).then((r) => r.items),
        [],
      ),
      safe<BlogPostSummary[]>(
        listBlogPosts({ pageSize: 3 }).then((r) => r.items),
        [],
      ),
    ]);

  return (
    <main className="bg-bg">
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <HeroBannerCarousel banners={banners} />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="mb-5 font-serif text-2xl font-bold text-text">Danh mục sách</h2>
        <CategoryShowcase featured={featuredCategories} tree={categoryTree} />
      </section>

      <section className="bg-primary-lightest py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-text">Series &amp; bộ truyện</h2>
          </div>
          <SeriesRail series={series} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-text">Sách mới về</h2>
          <Link
            href="/san-pham?sort=newest"
            className="text-sm font-medium text-primary-dark hover:underline"
          >
            Xem tất cả
          </Link>
        </div>
        <NewArrivalsSection products={newArrivals} />
      </section>

      <section className="bg-secondary-light py-10">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-5 font-serif text-2xl font-bold text-text">
            Vì sao chúng tôi ghi rõ tình trạng sách?
          </h2>
          <ConditionTrustSection />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-text">Blog &amp; review</h2>
          <Link href="/blog" className="text-sm font-medium text-primary-dark hover:underline">
            Xem tất cả
          </Link>
        </div>
        <BlogTeaser posts={blogPosts} />
      </section>
    </main>
  );
}
