import type { Metadata } from "next";
import { BannerListPage } from "@/features/banners/components/BannerListPage";

export const metadata: Metadata = {
  title: "Quản lý banner",
  robots: { index: false, follow: false },
};

export default function AdminBannersPage() {
  return <BannerListPage />;
}
