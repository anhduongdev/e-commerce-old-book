import Link from "next/link";
import { Eye, EyeOff, Folder, Pencil, Trash2 } from "lucide-react";
import type { Category } from "@/features/categories/types/category.types";

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

export function CategoryTable({
  categories,
  onDeleteRequest,
  onToggleActive,
}: {
  categories: Category[];
  onDeleteRequest: (category: Category) => void;
  onToggleActive: (category: Category) => void;
}) {
  if (categories.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-sm text-text-secondary shadow-sm">
        Không tìm thấy danh mục nào.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-semibold text-text-secondary">
            <th className="px-4 py-3">Tên danh mục</th>
            <th className="px-4 py-3">Slug</th>
            <th className="px-4 py-3">Cấp</th>
            <th className="px-4 py-3">Số sản phẩm</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3">Thứ tự</th>
            <th className="px-4 py-3">Cập nhật</th>
            <th className="px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <span className="flex items-center gap-2 text-text">
                  <Folder size={16} className="text-text-secondary" aria-hidden="true" />
                  {category.level === 2 ? (
                    <span className="text-text-secondary/60">— </span>
                  ) : null}
                  {category.name}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary">{category.slug}</td>
              <td className="px-4 py-3 text-text-secondary">{category.level}</td>
              <td className="px-4 py-3 text-text-secondary">{category.productCount}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    category.isActive
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {category.isActive ? "Hiển thị" : "Ẩn"}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary">{category.sortOrder}</td>
              <td className="px-4 py-3 text-text-secondary">{formatDate(category.updatedAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/categories/${category.id}/edit`}
                    aria-label="Sửa"
                    className="rounded-lg p-2 text-primary hover:bg-primary-lightest"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onToggleActive(category)}
                    aria-label={category.isActive ? "Ẩn danh mục" : "Hiện danh mục"}
                    className="rounded-lg p-2 text-primary hover:bg-primary-lightest"
                  >
                    {category.isActive ? (
                      <Eye size={16} aria-hidden="true" />
                    ) : (
                      <EyeOff size={16} aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(category)}
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
