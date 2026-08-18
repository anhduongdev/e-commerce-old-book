import type { Metadata } from "next";
import { SeriesListPage } from "@/features/series/components/SeriesListPage";

export const metadata: Metadata = {
  title: "Quản lý bộ truyện",
  robots: { index: false, follow: false },
};

export default function AdminSeriesPage() {
  return <SeriesListPage />;
}
