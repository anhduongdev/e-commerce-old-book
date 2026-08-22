import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/features/pages/services/pages-public";
import { PageContentView } from "@/features/pages/components/PageContentView";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("lien-he");
  return {
    title: page?.title ?? "Liên hệ",
    description: page?.metaDescription ?? undefined,
  };
}

export default async function LienHePage() {
  const page = await getPageBySlug("lien-he");
  if (!page) {
    notFound();
  }

  return <PageContentView page={page} />;
}
