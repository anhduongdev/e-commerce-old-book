import type { Metadata } from "next";
import { BannerFormPage } from "@/features/banners/components/BannerFormPage";

export const metadata: Metadata = {
  title: "Tạo banner mới",
  robots: { index: false, follow: false },
};

export default function NewBannerPage() {
  return <BannerFormPage mode="create" />;
}
