import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ContentPage } from "@/components/ContentPage";
import { DEFAULT_PAGES, getPage, type PageContent } from "@/lib/cms";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Image Compressor" },
      { name: "description", content: "Get in touch with the Image Compressor team." },
      { property: "og:title", content: "Contact — Image Compressor" },
      { property: "og:description", content: "Get in touch with the Image Compressor team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [content, setContent] = useState<PageContent>(DEFAULT_PAGES.contact);
  useEffect(() => setContent(getPage("contact")), []);
  return <ContentPage content={content} />;
}
