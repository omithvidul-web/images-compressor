import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import logo from "@/assets/logo.png.asset.json";
import { compressImage, formatBytes, type CompressResult } from "@/lib/compress";
import { nextAdLink } from "@/lib/ads";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Image Compressor — Shrink JPG, PNG, WEBP in your browser" },
      {
        name: "description",
        content:
          "Free online image compressor. Reduce JPG, PNG and WEBP file size in seconds — runs 100% in your browser, no upload required.",
      },
      { property: "og:title", content: "Image Compressor — Shrink JPG, PNG, WEBP in your browser" },
      {
        property: "og:description",
        content: "Compress images instantly with adjustable quality. Mobile-friendly. No signup.",
      },
    ],
  }),
  component: HomePage,
});

type Item = {
  id: string;
  file: File;
  status: "pending" | "compressing" | "done" | "error";
  result?: CompressResult;
  error?: string;
};

const PRESETS = {
  low: { label: "Low", q: 0.4 },
  medium: { label: "Medium", q: 0.7 },
  high: { label: "High", q: 0.9 },
} as const;

type PresetKey = keyof typeof PRESETS;

function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [preset, setPreset] = useState<PresetKey>("medium");
  const [quality, setQuality] = useState(70);
  const [dark, setDark] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  const onPickPreset = (k: PresetKey) => {
    setPreset(k);
    setQuality(Math.round(PRESETS[k].q * 100));
  };

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => /image\/(jpeg|jpg|png|webp)/.test(f.type));
      if (!arr.length) return;
      const newItems: Item[] = arr.map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        status: "pending",
      }));
      setItems((p) => [...newItems, ...p]);

      for (const it of newItems) {
        setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: "compressing" } : x)));
        try {
          const outputType = it.file.type === "image/png" ? "image/png" : "image/jpeg";
          // For PNG we still output JPEG for meaningful savings unless quality high
          const finalType =
            it.file.type === "image/webp" ? "image/webp" : outputType === "image/png" ? "image/jpeg" : "image/jpeg";
          const result = await compressImage(it.file, {
            quality: quality / 100,
            outputType: finalType as "image/jpeg" | "image/webp",
          });
          setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: "done", result } : x)));
        } catch (e) {
          setItems((p) =>
            p.map((x) =>
              x.id === it.id ? { ...x, status: "error", error: (e as Error).message } : x,
            ),
          );
        }
      }
    },
    [quality],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleDownload = (item: Item) => {
    if (!item.result) return;
    const ad = nextAdLink();
    if (ad) {
      window.open(ad.url, "_blank", "noopener,noreferrer");
    }
    const a = document.createElement("a");
    a.href = item.result.url;
    a.download = item.result.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const stats = useMemo(() => {
    const done = items.filter((i) => i.result);
    const orig = done.reduce((s, i) => s + (i.result?.originalSize ?? 0), 0);
    const comp = done.reduce((s, i) => s + (i.result?.compressedSize ?? 0), 0);
    return { count: done.length, orig, comp, saved: orig > 0 ? Math.round((1 - comp / orig) * 100) : 0 };
  }, [items]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo.url} alt="Image Compressor" className="h-10 w-10 rounded-xl shadow-md" />
          <div className="flex flex-col leading-tight">
            <span className="font-[Space_Grotesk] text-base font-bold tracking-tight">Image Compressor</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              In-browser · Private
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark((d) => !d)}
            className="rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-medium backdrop-blur transition hover:bg-card"
            aria-label="Toggle dark mode"
          >
            {dark ? "☀ Light" : "☾ Dark"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24">
        {/* Hero */}
        <section className="pt-6 pb-8 text-center sm:pt-12 sm:pb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 100% client-side · nothing uploaded
          </span>
          <h1 className="mt-5 font-[Space_Grotesk] text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Squeeze your images{" "}
            <span className="brand-gradient-text">without losing the magic.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            Drop JPG, PNG or WEBP files. Pick a quality. Download a smaller version in seconds — right from
            your browser.
          </p>
        </section>

        {/* Upload card */}
        <section
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`glass-card brand-glow group relative overflow-hidden rounded-3xl p-6 sm:p-10 transition ${
            dragging ? "ring-2 ring-blue-500/60 scale-[1.01]" : ""
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-1 brand-gradient" />
          <div className="flex flex-col items-center text-center">
            <div className="brand-gradient mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold sm:text-xl">Drop images here</h2>
            <p className="mt-1 text-sm text-muted-foreground">or tap to choose from your device</p>
            <button
              onClick={() => inputRef.current?.click()}
              className="brand-gradient mt-5 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
            >
              Select images
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <p className="mt-3 text-[11px] text-muted-foreground">JPG · PNG · WEBP — up to ~25MB each</p>
          </div>

          {/* Quality controls */}
          <div className="mt-8 grid gap-4 border-t border-border/60 pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Quality
                </label>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold tabular-nums">
                  {quality}%
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <div className="flex gap-1.5 rounded-full bg-secondary p-1">
              {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => onPickPreset(k)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    preset === k && Math.round(PRESETS[k].q * 100) === quality
                      ? "brand-gradient text-white shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {PRESETS[k].label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        {stats.count > 0 && (
          <section className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
            <StatCard label="Files" value={stats.count.toString()} />
            <StatCard label="Original" value={formatBytes(stats.orig)} />
            <StatCard
              label="Saved"
              value={`${stats.saved}%`}
              accent
              sub={`${formatBytes(stats.orig - stats.comp)}`}
            />
          </section>
        )}

        {/* Results */}
        {items.length > 0 && (
          <section className="mt-8 space-y-4">
            <h3 className="font-[Space_Grotesk] text-lg font-bold">Your images</h3>
            <div className="grid gap-4">
              {items.map((it) => (
                <ResultCard key={it.id} item={it} onDownload={() => handleDownload(it)} />
              ))}
            </div>
          </section>
        )}

        {/* Features strip */}
        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            { t: "Lightning fast", d: "Canvas-API compression — no server round trip." },
            { t: "Privacy first", d: "Files never leave your device." },
            { t: "Mobile ready", d: "Polished on phones, tablets, and desktop." },
          ].map((f) => (
            <div key={f.t} className="glass-card rounded-2xl p-5">
              <div className="brand-gradient mb-3 h-1.5 w-10 rounded-full" />
              <div className="font-semibold">{f.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Image Compressor · Built with care
      </footer>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`glass-card rounded-2xl p-4 ${accent ? "brand-glow" : ""}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 text-xl font-bold tabular-nums sm:text-2xl ${accent ? "brand-gradient-text" : ""}`}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function ResultCard({ item, onDownload }: { item: Item; onDownload: () => void }) {
  const r = item.result;
  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="grid gap-0 sm:grid-cols-[160px_1fr_auto] sm:items-center">
        <div className="aspect-square w-full bg-secondary/50 sm:h-full sm:w-40">
          {r ? (
            <img src={r.url} alt={item.file.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              {item.status === "compressing" ? (
                <Spinner />
              ) : item.status === "error" ? (
                "Failed"
              ) : (
                "Queued"
              )}
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="truncate text-sm font-semibold">{item.file.name}</div>
          {r ? (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{r.width}×{r.height}</span>
                <span>·</span>
                <span className="line-through">{formatBytes(r.originalSize)}</span>
                <span>→</span>
                <span className="font-semibold text-foreground">{formatBytes(r.compressedSize)}</span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  −{r.savedPct}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="brand-gradient h-full"
                  style={{ width: `${Math.max(4, 100 - r.savedPct)}%` }}
                />
              </div>
            </>
          ) : item.status === "error" ? (
            <div className="mt-1 text-xs text-destructive">{item.error}</div>
          ) : (
            <div className="mt-1 text-xs text-muted-foreground">
              {item.status === "compressing" ? "Compressing…" : "Waiting…"}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end p-4 sm:pr-5">
          <button
            disabled={!r}
            onClick={onDownload}
            className="brand-gradient rounded-full px-5 py-2 text-sm font-semibold text-white shadow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-6 w-6 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
