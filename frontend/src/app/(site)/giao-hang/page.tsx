import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/features/pages/services/pages-public";
import { PageContentView } from "@/features/pages/components/PageContentView";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("giao-hang");
  return {
    title: page?.title ?? "Chính sách giao hàng",
    description: page?.metaDescription ?? undefined,
  };
}

export default async function GiaoHangPage() {
  const page = await getPageBySlug("giao-hang");
  if (!page) {
    notFound();
  }

  return <PageContentView page={page} />;
}
