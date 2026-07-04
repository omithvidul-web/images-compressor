import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ContentPage } from "@/components/ContentPage";
import { DEFAULT_PAGES, getPage, type PageContent } from "@/lib/cms";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Image Compressor" },
      { name: "description", content: "Terms of service for using Image Compressor." },
      { property: "og:title", content: "Terms of Service — Image Compressor" },
      { property: "og:description", content: "Terms of service for using Image Compressor." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const [content, setContent] = useState<PageContent>(DEFAULT_PAGES.terms);
  useEffect(() => setContent(getPage("terms")), []);
  return <ContentPage content={content} />;
}
