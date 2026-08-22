import type { CatalogProduct } from "@/features/catalog/types/catalog.types";
import { ProductGrid } from "@/features/catalog/components/ProductGrid";

export function NewArrivalsSection({ products }: { products: CatalogProduct[] }) {
  if (products.length === 0) return null;

  return <ProductGrid products={products} />;
}
