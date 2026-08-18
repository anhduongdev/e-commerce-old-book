import type { Metadata } from "next";
import { SeriesFormPage } from "@/features/series/components/SeriesFormPage";

export const metadata: Metadata = {
  title: "Cập nhật series",
  robots: { index: false, follow: false },
};

export default async function EditSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SeriesFormPage mode="edit" seriesId={id} />;
}
