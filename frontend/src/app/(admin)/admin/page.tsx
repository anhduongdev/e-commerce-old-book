import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tổng quan",
  robots: { index: false, follow: false },
};

export default function AdminOverviewPage() {
  return (
    <div className="rounded-2xl bg-bg p-10 text-center shadow-sm">
      <h1 className="font-serif text-2xl font-bold text-text">Tổng quan</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Trang tổng quan đang được xây dựng. Hiện tại có thể quản lý danh mục ở
        mục &quot;Danh mục&quot; bên trái.
      </p>
    </div>
  );
}
