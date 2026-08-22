import Link from "next/link";
import { Folder } from "lucide-react";
import type { CatalogCategoryNode } from "@/features/catalog/types/catalog.types";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
).replace(/\/api\/?$/, "");

function resolveImageUrl(url: string) {
  return url.startsWith("http") ? url : `${BACKEND_ORIGIN}${url}`;
}

export function CategoryShowcase({
  featured,
  tree,
}: {
  featured: CatalogCategoryNode[];
  tree: CatalogCategoryNode[];
}) {
  const highlighted = featured.length > 0 ? featured : tree;

  if (highlighted.length === 0) return null;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {highlighted.slice(0, 6).map((category) => (
          <Link
            key={category.id}
            href={`/san-pham?categoryId=${category.id}`}
            className="group flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary-lightest">
              {category.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveImageUrl(category.imageUrl)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Folder size={24} className="text-primary-dark" aria-hidden="true" />
              )}
            </span>
            <span className="text-sm font-medium text-text group-hover:text-primary-dark">
              {category.name}
            </span>
          </Link>
        ))}
      </div>

      {tree.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {tree.map((category) => (
            <Link
              key={category.id}
              href={`/san-pham?categoryId=${category.id}`}
              className="rounded-full border border-border bg-white px-4 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary-dark"
            >
              {category.name}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
