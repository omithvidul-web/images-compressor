import { useEffect, useState } from "react";
import { logoDataUri } from "@/lib/logo";
import { getAndroidBridge, isAndroidApp } from "@/lib/platform";
import type { AdmobConfig } from "@/lib/admob.functions";

const SPLASH_MS = 2500;
const SESSION_KEY = "ic.splash.shown";

/**
 * Branded splash screen. Shows once per browser session.
 * When running inside the Android WebView, also triggers the App Open ad
 * immediately after the splash finishes using the ID from admob_config.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    setVisible(true);
    sessionStorage.setItem(SESSION_KEY, "1");

    const fadeAt = window.setTimeout(() => setFading(true), SPLASH_MS - 300);
    const hideAt = window.setTimeout(() => {
      setVisible(false);
      if (isAndroidApp()) {
        fetch("/api/public/admob-config")
          .then((r) => (r.ok ? r.json() : null))
          .then((cfg: AdmobConfig | null) => {
            const bridge = getAndroidBridge();
            if (cfg?.app_open_id && bridge?.showAppOpen) bridge.showAppOpen(cfg.app_open_id);
          })
          .catch(() => {});
      }
    }, SPLASH_MS);

    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(hideAt);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-300"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <img
        src={logoDataUri}
        alt="Image Compressor"
        className="h-24 w-24 rounded-3xl shadow-xl"
        draggable={false}
      />
      <h1
        className="mt-6 text-3xl font-extrabold tracking-tight"
        style={{
          fontFamily: '"Space Grotesk", "SF Pro Display", system-ui, sans-serif',
          letterSpacing: "-0.03em",
          background: "linear-gradient(90deg,#7c3aed 0%,#2563eb 50%,#06b6d4 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Image Compressor
      </h1>
      <p className="mt-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
        Fast · Private · Free
      </p>
    </div>
  );
}
