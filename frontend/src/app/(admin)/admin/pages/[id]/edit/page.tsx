import type { Metadata } from "next";
import { PageFormPage } from "@/features/pages/components/PageFormPage";

export const metadata: Metadata = {
  title: "Chỉnh sửa trang",
  robots: { index: false, follow: false },
};

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PageFormPage mode="edit" pageId={id} />;
}
