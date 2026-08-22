import type { Metadata } from "next";
import { BannerFormPage } from "@/features/banners/components/BannerFormPage";

export const metadata: Metadata = {
  title: "Chỉnh sửa banner",
  robots: { index: false, follow: false },
};

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BannerFormPage mode="edit" bannerId={id} />;
}
