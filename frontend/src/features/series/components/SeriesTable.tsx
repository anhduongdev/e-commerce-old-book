import Link from "next/link";
import { BookOpen, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import type { Series } from "@/features/series/types/series.types";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
).replace(/\/api\/?$/, "");

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SeriesTable({
  series,
  onDeleteRequest,
  onToggleActive,
}: {
  series: Series[];
  onDeleteRequest: (series: Series) => void;
  onToggleActive: (series: Series) => void;
}) {
  if (series.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-sm text-brand-600 shadow-sm">
        Không tìm thấy bộ truyện nào.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-brand-100 text-xs font-semibold text-brand-600">
            <th className="px-4 py-3">Tên series</th>
            <th className="px-4 py-3">Slug</th>
            <th className="px-4 py-3">Tác giả</th>
            <th className="px-4 py-3">NXB</th>
            <th className="px-4 py-3">Số tập</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3">Cập nhật</th>
            <th className="px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {series.map((item) => (
            <tr key={item.id} className="border-b border-brand-100 last:border-0">
              <td className="px-4 py-3">
                <span className="flex items-center gap-2 text-brand-900">
                  {item.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${BACKEND_ORIGIN}${item.coverUrl}`}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <BookOpen size={16} className="text-brand-600" aria-hidden="true" />
                  )}
                  {item.name}
                </span>
              </td>
              <td className="px-4 py-3 text-brand-600">{item.slug}</td>
              <td className="px-4 py-3 text-brand-600">{item.author ?? "—"}</td>
              <td className="px-4 py-3 text-brand-600">{item.publisher ?? "—"}</td>
              <td className="px-4 py-3 text-brand-600">{item.totalVolumes ?? "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {item.isActive ? "Hiển thị" : "Ẩn"}
                </span>
              </td>
              <td className="px-4 py-3 text-brand-600">{formatDate(item.updatedAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/series/${item.id}/edit`}
                    aria-label="Sửa"
                    className="rounded-lg p-2 text-brand-700 hover:bg-brand-50"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onToggleActive(item)}
                    aria-label={item.isActive ? "Ẩn bộ truyện" : "Hiện bộ truyện"}
                    className="rounded-lg p-2 text-brand-700 hover:bg-brand-50"
                  >
                    {item.isActive ? (
                      <Eye size={16} aria-hidden="true" />
                    ) : (
                      <EyeOff size={16} aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(item)}
                    aria-label="Xóa"
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
