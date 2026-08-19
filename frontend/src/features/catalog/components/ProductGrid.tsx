import type { CatalogProduct } from "@/features/catalog/types/catalog.types";
import { ProductCard } from "@/features/catalog/components/ProductCard";

export function ProductGrid({ products }: { products: CatalogProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-16 text-center text-sm text-brand-600 shadow-sm">
        Không tìm thấy sản phẩm phù hợp.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
