import { BookOpen } from "lucide-react";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
).replace(/\/api\/?$/, "");

export function CategoryPreviewCard({
  name,
  slug,
  description,
  imageUrl,
}: {
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-serif text-lg font-bold text-brand-900">
        Xem trước danh mục
      </h3>
      <div className="mt-4 overflow-hidden rounded-xl border border-brand-100">
        <div className="flex h-32 items-center justify-center bg-brand-50">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${BACKEND_ORIGIN}${imageUrl}`}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <BookOpen size={32} className="text-brand-600" aria-hidden="true" />
          )}
        </div>
        <div className="p-4">
          <p className="font-serif text-base font-bold text-brand-900">
            {name || "Tên danh mục"}
          </p>
          <p className="text-xs text-brand-600">{slug || "url-danh-muc"}</p>
          <p className="mt-2 text-sm text-brand-600">
            {description || "Mô tả ngắn về danh mục sẽ hiển thị ở đây..."}
          </p>
        </div>
      </div>
    </div>
  );
}
