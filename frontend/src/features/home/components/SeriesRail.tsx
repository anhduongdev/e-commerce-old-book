import Link from "next/link";
import { BookMarked } from "lucide-react";
import type { CatalogSeries } from "@/features/catalog/types/catalog.types";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
).replace(/\/api\/?$/, "");

function resolveImageUrl(url: string) {
  return url.startsWith("http") ? url : `${BACKEND_ORIGIN}${url}`;
}

export function SeriesRail({ series }: { series: CatalogSeries[] }) {
  if (series.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-8">
      {series.map((item) => (
        <Link
          key={item.id}
          href={`/bo-truyen/${item.slug}`}
          className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-primary-lightest">
            {item.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveImageUrl(item.coverUrl)}
                alt=""
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <BookMarked size={28} className="text-primary-dark" aria-hidden="true" />
            )}
          </div>
          <div className="p-2.5">
            <p className="line-clamp-1 text-sm font-semibold text-text">{item.name}</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              {item.totalVolumes ? `${item.totalVolumes} tập` : `${item.productCount} tập đang bán`}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
