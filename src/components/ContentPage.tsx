import { Link } from "@tanstack/react-router";
import type { PageContent } from "@/lib/cms";
import { SiteHeader } from "@/components/SiteHeader";

export function ContentPage({ content }: { content: PageContent }) {
  const paragraphs = content.body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-purple-500/15 blur-3xl" />
        <div className="absolute top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      <SiteHeader />

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-4">
        <div className="glass-card brand-glow rounded-3xl p-6 sm:p-10">
          <div className="brand-gradient mb-5 h-1 w-14 rounded-full" />
          <h1 className="font-[Space_Grotesk] text-3xl font-extrabold tracking-tight sm:text-4xl">
            {content.title}
          </h1>
          {content.subtitle && (
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">{content.subtitle}</p>
          )}
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-foreground/90">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {p}
              </p>
            ))}
          </div>
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-card"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Image Compressor
      </footer>
    </div>
  );
}
