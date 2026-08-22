import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/features/pages/services/pages-public";
import { PageContentView } from "@/features/pages/components/PageContentView";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("doi-tra");
  return {
    title: page?.title ?? "Chính sách đổi trả",
    description: page?.metaDescription ?? undefined,
  };
}

export default async function DoiTraPage() {
  const page = await getPageBySlug("doi-tra");
  if (!page) {
    notFound();
  }

  return <PageContentView page={page} />;
}
