import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { Banner, BannerPosition } from "@/features/banners/types/banner.types";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
).replace(/\/api\/?$/, "");

const POSITION_LABELS: Record<BannerPosition, string> = {
  HOME_HERO: "Banner chính trang chủ",
  HOME_SUB: "Banner phụ trang chủ",
  SIDEBAR: "Banner thanh bên",
};

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

function formatSchedule(banner: Banner): string {
  if (!banner.startAt && !banner.endAt) return "Luôn hiển thị";
  const start = banner.startAt ? formatDate(banner.startAt) : "Không giới hạn";
  const end = banner.endAt ? formatDate(banner.endAt) : "Không giới hạn";
  return `${start} – ${end}`;
}

export function BannerTable({
  banners,
  onDeleteRequest,
}: {
  banners: Banner[];
  onDeleteRequest: (banner: Banner) => void;
}) {
  if (banners.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-sm text-text-secondary shadow-sm">
        Không tìm thấy banner nào.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-semibold text-text-secondary">
            <th className="px-4 py-3">Ảnh</th>
            <th className="px-4 py-3">Tiêu đề</th>
            <th className="px-4 py-3">Vị trí</th>
            <th className="px-4 py-3">Thứ tự</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3">Lịch hiển thị</th>
            <th className="px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {banners.map((banner) => (
            <tr key={banner.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${BACKEND_ORIGIN}${banner.imageUrl}`}
                  alt=""
                  className="h-12 w-20 rounded-lg object-cover"
                />
              </td>
              <td className="px-4 py-3 text-text">{banner.title ?? "—"}</td>
              <td className="px-4 py-3 text-text-secondary">
                {POSITION_LABELS[banner.position]}
              </td>
              <td className="px-4 py-3 text-text-secondary">{banner.sortOrder}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    banner.isActive
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {banner.isActive ? "Hiển thị" : "Ẩn"}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                {formatSchedule(banner)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/banners/${banner.id}/edit`}
                    aria-label="Sửa"
                    className="rounded-lg p-2 text-primary hover:bg-primary-lightest"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(banner)}
                    aria-label="Xóa"
                    className="rounded-lg p-2 text-error hover:bg-error/10"
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
