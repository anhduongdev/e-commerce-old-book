import type { Metadata } from "next";
import { PageFormPage } from "@/features/pages/components/PageFormPage";

export const metadata: Metadata = {
  title: "Tạo trang mới",
  robots: { index: false, follow: false },
};

export default function NewPagePage() {
  return <PageFormPage mode="create" />;
}
