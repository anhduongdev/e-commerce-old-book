import Link from "next/link";
import { Package, Pencil, Trash2 } from "lucide-react";
import type { ProductListItem } from "@/features/products/types/product.types";
import { formatDate, formatPriceVnd } from "@/features/products/utils/format";
import { ProductStatusBadge } from "@/features/products/components/ProductStatusBadge";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
).replace(/\/api\/?$/, "");

export function ProductTable({
  products,
  onDeleteRequest,
}: {
  products: ProductListItem[];
  onDeleteRequest: (product: ProductListItem) => void;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-sm text-brand-600 shadow-sm">
        Không tìm thấy sản phẩm nào.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead>
          <tr className="border-b border-brand-100 text-xs font-semibold text-brand-600">
            <th className="px-4 py-3">Sản phẩm</th>
            <th className="px-4 py-3">Bộ truyện</th>
            <th className="px-4 py-3">Giá</th>
            <th className="px-4 py-3">Tổng kho</th>
            <th className="px-4 py-3">Số tập</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3">Cập nhật</th>
            <th className="px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {products.map((item) => (
            <tr key={item.id} className="border-b border-brand-100 last:border-0">
              <td className="px-4 py-3">
                <span className="flex items-center gap-2 text-brand-900">
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${BACKEND_ORIGIN}${item.thumbnailUrl}`}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-brand-50">
                      <Package size={16} className="text-brand-600" aria-hidden="true" />
                    </span>
                  )}
                  <span>
                    <span className="block font-medium">{item.name}</span>
                    <span className="block text-xs text-brand-600">{item.slug}</span>
                  </span>
                </span>
              </td>
              <td className="px-4 py-3 text-brand-600">
                {item.seriesName ?? (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs">Sách lẻ</span>
                )}
              </td>
              <td className="px-4 py-3 text-brand-600">
                {item.minPrice ? formatPriceVnd(item.minPrice) : "—"}
              </td>
              <td className={`px-4 py-3 ${item.totalStock === 0 ? "text-red-600" : "text-brand-600"}`}>
                {item.totalStock}
              </td>
              <td className="px-4 py-3 text-brand-600">{item.variantCount}</td>
              <td className="px-4 py-3">
                <ProductStatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3 text-brand-600">{formatDate(item.updatedAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/products/${item.id}/edit`}
                    aria-label="Sửa"
                    className="rounded-lg p-2 text-brand-700 hover:bg-brand-50"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </Link>
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
