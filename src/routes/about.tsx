import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ContentPage } from "@/components/ContentPage";
import { DEFAULT_PAGES, getPage, type PageContent } from "@/lib/cms";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Image Compressor" },
      { name: "description", content: "About Image Compressor — a fast, private, in-browser image optimization tool." },
      { property: "og:title", content: "About — Image Compressor" },
      { property: "og:description", content: "About Image Compressor — a fast, private, in-browser image optimization tool." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const [content, setContent] = useState<PageContent>(DEFAULT_PAGES.about);
  useEffect(() => setContent(getPage("about")), []);
  return <ContentPage content={content} />;
}
