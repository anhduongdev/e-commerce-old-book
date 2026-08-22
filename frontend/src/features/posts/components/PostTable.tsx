import Link from "next/link";
import { FileText, Pencil, Trash2 } from "lucide-react";
import type { Post } from "@/features/posts/types/post.types";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
).replace(/\/api\/?$/, "");

function formatDate(iso: string | null): string {
  if (!iso) return "Chưa đăng";
  const date = new Date(iso);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PostTable({
  posts,
  onDeleteRequest,
}: {
  posts: Post[];
  onDeleteRequest: (post: Post) => void;
}) {
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-sm text-text-secondary shadow-sm">
        Không tìm thấy bài viết nào.
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
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3">Ngày đăng</th>
            <th className="px-4 py-3">Lượt xem</th>
            <th className="px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                {post.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${BACKEND_ORIGIN}${post.thumbnailUrl}`}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-secondary text-text-secondary">
                    <FileText size={16} aria-hidden="true" />
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="text-text">{post.title}</span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    post.status === "PUBLISHED"
                      ? "bg-success/10 text-success"
                      : "bg-bg-secondary text-text-secondary"
                  }`}
                >
                  {post.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary">{formatDate(post.publishedAt)}</td>
              <td className="px-4 py-3 text-text-secondary">{post.viewCount}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    aria-label="Sửa"
                    className="rounded-lg p-2 text-primary hover:bg-primary-lightest"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(post)}
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
