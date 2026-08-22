import type { Metadata } from "next";
import { PageListPage } from "@/features/pages/components/PageListPage";

export const metadata: Metadata = {
  title: "Quản lý trang nội dung",
  robots: { index: false, follow: false },
};

export default function AdminPagesPage() {
  return <PageListPage />;
}
