import { BookMarked } from "lucide-react";
import type { CatalogSeriesDetail } from "@/features/catalog/types/catalog.types";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
).replace(/\/api\/?$/, "");

export function SeriesDetailHeader({ series }: { series: CatalogSeriesDetail }) {
  const subtitle = [series.author, series.publisher].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="w-full flex-shrink-0 md:w-64">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-border bg-primary-lightest">
          {series.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${BACKEND_ORIGIN}${series.coverUrl}`}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookMarked size={40} className="text-text-secondary" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-center">
        <h1 className="font-serif text-3xl font-bold text-text">{series.name}</h1>
        {subtitle ? <p className="mt-2 text-text-secondary">{subtitle}</p> : null}
        {series.description ? (
          <p className="mt-4 whitespace-pre-line text-sm text-text-secondary">
            {series.description}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-text-secondary">
          {series.totalVolumes ? <span>Trọn bộ {series.totalVolumes} tập</span> : null}
          <span>{series.productCount} tập đang bán</span>
        </div>
      </div>
    </div>
  );
}
