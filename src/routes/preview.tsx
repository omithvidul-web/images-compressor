import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import logo from "@/assets/logo.png.asset.json";
import {
  clearPendingFiles,
  getPendingFiles,
  type PreviewFile,
} from "@/lib/previewStore";
import { compressImage, formatBytes, type CompressResult } from "@/lib/compress";
import { nextAdLink } from "@/lib/ads";

export const Route = createFileRoute("/preview")({
  head: () => ({
    meta: [
      { title: "Preview compressed image — Image Compressor" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PreviewPage,
});

type Item = {
  id: string;
  file: File;
  previewUrl: string;
  status: "compressing" | "done" | "error";
  result?: CompressResult;
  error?: string;
};

function PreviewPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const pending: PreviewFile[] = getPendingFiles();
    if (pending.length === 0) {
      navigate({ to: "/" });
      return;
    }

    const initial: Item[] = pending.map((p) => ({
      id: p.id,
      file: p.file,
      previewUrl: p.previewUrl,
      status: "compressing",
    }));
    setItems(initial);

    (async () => {
      for (const it of initial) {
        try {
          const finalType =
            it.file.type === "image/webp" ? "image/webp" : "image/jpeg";
          const result = await compressImage(it.file, {
            quality: 0.7,
            outputType: finalType as "image/jpeg" | "image/webp",
          });
          setItems((p) =>
            p.map((x) => (x.id === it.id ? { ...x, status: "done", result } : x)),
          );
        } catch (e) {
          setItems((p) =>
            p.map((x) =>
              x.id === it.id
                ? { ...x, status: "error", error: (e as Error).message }
                : x,
            ),
          );
        }
      }
    })();
  }, [navigate]);

  const allDone = items.length > 0 && items.every((i) => i.status !== "compressing");

  const stats = useMemo(() => {
    const done = items.filter((i) => i.result);
    const orig = done.reduce((s, i) => s + (i.result?.originalSize ?? 0), 0);
    const comp = done.reduce((s, i) => s + (i.result?.compressedSize ?? 0), 0);
    return {
      orig,
      comp,
      saved: orig > 0 ? Math.round((1 - comp / orig) * 100) : 0,
    };
  }, [items]);

  const handleCancel = () => {
    clearPendingFiles();
    navigate({ to: "/" });
  };

  const handleDownloadAll = () => {
    const ad = nextAdLink();
    if (ad) window.open(ad.url, "_blank", "noopener,noreferrer");

    for (const it of items) {
      if (!it.result) continue;
      const a = document.createElement("a");
      a.href = it.result.url;
      a.download = it.result.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    setTimeout(() => {
      clearPendingFiles();
      navigate({ to: "/" });
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <header className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo.url} alt="Image Compressor" className="h-10 w-10 rounded-xl shadow-md" />
          <span className="font-[Space_Grotesk] text-base font-bold tracking-tight">
            Image Compressor
          </span>
        </Link>
        <button
          onClick={handleCancel}
          className="rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-medium backdrop-blur transition hover:bg-card"
        >
          Cancel
        </button>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-24">
        <section className="pt-2 pb-6 text-center sm:pt-6 sm:pb-8">
          <h1 className="font-[Space_Grotesk] text-3xl font-extrabold tracking-tight sm:text-4xl">
            Compressed <span className="brand-gradient-text">preview</span>
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Review your optimized {items.length > 1 ? "images" : "image"} below. Download when ready.
          </p>
        </section>

        <div className="grid gap-4">
          {items.map((it) => (
            <PreviewCard key={it.id} item={it} />
          ))}
        </div>

        {allDone && stats.orig > 0 && (
          <div className="glass-card mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
            <div className="text-sm">
              <span className="text-muted-foreground line-through">{formatBytes(stats.orig)}</span>{" "}
              <span className="font-semibold">→ {formatBytes(stats.comp)}</span>{" "}
              <span className="ml-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                −{stats.saved}%
              </span>
            </div>
          </div>
        )}

        <div className="sticky bottom-4 mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={handleCancel}
            className="rounded-full border border-border bg-card/70 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-card"
          >
            Cancel
          </button>
          <button
            onClick={handleDownloadAll}
            disabled={!allDone || !items.some((i) => i.result)}
            className="brand-gradient rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {allDone ? "Download" : "Compressing…"}
          </button>
        </div>
      </main>
    </div>
  );
}

function PreviewCard({ item }: { item: Item }) {
  const r = item.result;
  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="grid gap-0 sm:grid-cols-[200px_1fr] sm:items-center">
        <div className="relative aspect-square w-full bg-secondary/50 sm:h-full">
          <img
            src={r?.url ?? item.previewUrl}
            alt={item.file.name}
            className="h-full w-full object-cover"
          />
          {item.status === "compressing" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <svg className="h-7 w-7 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="truncate text-sm font-semibold">{item.file.name}</div>
          {r ? (
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{r.width}×{r.height}</span>
                <span>·</span>
                <span className="line-through">{formatBytes(r.originalSize)}</span>
                <span>→</span>
                <span className="font-semibold text-foreground">{formatBytes(r.compressedSize)}</span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  −{r.savedPct}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="brand-gradient h-full" style={{ width: `${Math.max(4, 100 - r.savedPct)}%` }} />
              </div>
            </div>
          ) : item.status === "error" ? (
            <div className="mt-1 text-xs text-destructive">{item.error}</div>
          ) : (
            <div className="mt-1 text-xs text-muted-foreground">Compressing…</div>
          )}
        </div>
      </div>
    </div>
  );
}
