import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/features/pages/services/pages-public";
import { PageContentView } from "@/features/pages/components/PageContentView";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("thanh-toan");
  return {
    title: page?.title ?? "Chính sách thanh toán",
    description: page?.metaDescription ?? undefined,
  };
}

export default async function ThanhToanPage() {
  const page = await getPageBySlug("thanh-toan");
  if (!page) {
    notFound();
  }

  return <PageContentView page={page} />;
}
