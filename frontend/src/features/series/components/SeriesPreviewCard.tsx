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
      <h3 className="font-serif text-lg font-bold text-brand-900">
        Xem trước bộ truyện
      </h3>
      <div className="mt-4 overflow-hidden rounded-xl border border-brand-100">
        <div className="flex h-32 items-center justify-center bg-brand-50">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${BACKEND_ORIGIN}${coverUrl}`}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <BookOpen size={32} className="text-brand-600" aria-hidden="true" />
          )}
        </div>
        <div className="p-4">
          <p className="font-serif text-base font-bold text-brand-900">
            {name || "Tên bộ truyện"}
          </p>
          <p className="text-xs text-brand-600">{slug || "ten-bo-truyen"}</p>
          {subtitle ? (
            <p className="mt-1 text-xs text-brand-600">{subtitle}</p>
          ) : null}
          <p className="mt-2 text-sm text-brand-600">
            {description || "Mô tả ngắn về bộ truyện sẽ hiển thị ở đây..."}
          </p>
        </div>
      </div>
    </div>
  );
}
