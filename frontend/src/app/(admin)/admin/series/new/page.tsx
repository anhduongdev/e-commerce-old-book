import type { Metadata } from "next";
import { SeriesFormPage } from "@/features/series/components/SeriesFormPage";

export const metadata: Metadata = {
  title: "Tạo bộ truyện mới",
  robots: { index: false, follow: false },
};

export default function NewSeriesPage() {
  return <SeriesFormPage mode="create" />;
}
