import { BookOpen } from "lucide-react";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
).replace(/\/api\/?$/, "");

export function SeriesPreviewCard({
  name,
  slug,
  description,
  coverUrl,
  author,
  totalVolumes,
}: {
  name: string;
  slug: string;
  description: string;
  coverUrl: string | null;
  author: string;
  totalVolumes: string;
}) {
  const subtitle = [author || null, totalVolumes ? `${totalVolumes} tập` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-serif text-lg font-bold text-text">
        Xem trước bộ truyện
      </h3>
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <div className="flex h-32 items-center justify-center bg-primary-lightest">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${BACKEND_ORIGIN}${coverUrl}`}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <BookOpen size={32} className="text-text-secondary" aria-hidden="true" />
          )}
        </div>
        <div className="p-4">
          <p className="font-serif text-base font-bold text-text">
            {name || "Tên bộ truyện"}
          </p>
          <p className="text-xs text-text-secondary">{slug || "ten-bo-truyen"}</p>
          {subtitle ? (
            <p className="mt-1 text-xs text-text-secondary">{subtitle}</p>
          ) : null}
          <p className="mt-2 text-sm text-text-secondary">
            {description || "Mô tả ngắn về bộ truyện sẽ hiển thị ở đây..."}
          </p>
        </div>
      </div>
    </div>
  );
}
