import Link from "next/link";
import { FileText, Pencil, Trash2 } from "lucide-react";
import type { Page } from "@/features/pages/types/page.types";

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

export function PageTable({
  pages,
  onDeleteRequest,
}: {
  pages: Page[];
  onDeleteRequest: (page: Page) => void;
}) {
  if (pages.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-sm text-text-secondary shadow-sm">
        Không tìm thấy trang nào.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-semibold text-text-secondary">
            <th className="px-4 py-3">Tiêu đề</th>
            <th className="px-4 py-3">Slug</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3">Cập nhật lần cuối</th>
            <th className="px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => (
            <tr key={page.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <span className="flex items-center gap-2 text-text">
                  <FileText size={16} className="text-text-secondary" aria-hidden="true" />
                  {page.title}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary">{page.slug}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    page.isActive
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {page.isActive ? "Hiển thị" : "Ẩn"}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary">{formatDate(page.updatedAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/pages/${page.id}/edit`}
                    aria-label="Sửa"
                    className="rounded-lg p-2 text-primary hover:bg-primary-lightest"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(page)}
                    aria-label="Xóa"
                    className="rounded-lg p-2 text-text-secondary hover:bg-error/10 hover:text-error"
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
