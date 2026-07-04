import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ContentPage } from "@/components/ContentPage";
import { DEFAULT_PAGES, getPage, type PageContent } from "@/lib/cms";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Image Compressor" },
      { name: "description", content: "How Image Compressor handles your data. All image processing happens in-browser." },
      { property: "og:title", content: "Privacy Policy — Image Compressor" },
      { property: "og:description", content: "How Image Compressor handles your data. All image processing happens in-browser." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const [content, setContent] = useState<PageContent>(DEFAULT_PAGES.privacy);
  useEffect(() => setContent(getPage("privacy")), []);
  return <ContentPage content={content} />;
}
