import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { CatalogPage } from "@/features/catalog/components/CatalogPage";

export const metadata: Metadata = {
  title: "Sản phẩm",
};

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      }
    >
      <CatalogPage />
    </Suspense>
  );
}
