import { useEffect, useId, useState } from "react";
import { getAndroidBridge, useIsAndroidApp } from "@/lib/platform";
import type { AdmobConfig } from "@/lib/admob.functions";

type AdmobFormat = "banner" | "interstitial" | "rewarded" | "rewarded_interstitial" | "app_open" | "native";

type Props = {
  /** Slot rendered for standard web browsers (AdSense / Adsterra units). */
  web?: React.ReactNode;
  /** Which AdMob format to trigger when running inside the Android WebView. */
  app?: AdmobFormat;
  className?: string;
};

/**
 * Renders `web` for browser visitors. Inside the Android WebView, all web ads
 * are hidden and the matching AdMob format is triggered via window.AndroidBridge
 * using the Ad Unit ID fetched from /api/public/admob-config.
 */
export function AdSlot({ web, app, className }: Props) {
  const isApp = useIsAndroidApp();
  const [config, setConfig] = useState<AdmobConfig | null>(null);
  const containerId = useId().replace(/:/g, "");

  useEffect(() => {
    if (!isApp) return;
    let cancelled = false;
    fetch("/api/public/admob-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setConfig(data as AdmobConfig);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isApp]);

  useEffect(() => {
    if (!isApp || !app || !config) return;
    const bridge = getAndroidBridge();
    if (!bridge) return;
    const unitId =
      app === "banner"
        ? config.banner_id
        : app === "interstitial"
          ? config.interstitial_id
          : app === "rewarded"
            ? config.rewarded_id
            : app === "rewarded_interstitial"
              ? config.rewarded_interstitial_id
              : app === "app_open"
                ? config.app_open_id
                : config.native_id;
    if (!unitId) return;
    if (app === "banner") bridge.showBanner?.(unitId);
    else if (app === "interstitial") bridge.showInterstitial?.(unitId);
    else if (app === "rewarded") bridge.showRewarded?.(unitId);
    else if (app === "rewarded_interstitial") bridge.showRewardedInterstitial?.(unitId);
    else if (app === "app_open") bridge.showAppOpen?.(unitId);
    else if (app === "native") bridge.loadNative?.(unitId, containerId);
  }, [isApp, app, config, containerId]);

  // Inside the app: hide all web ads (Play Store policy) and render a
  // placeholder container that the native SDK can inflate into.
  if (isApp) {
    if (app === "native") return <div id={containerId} className={className} data-admob-native={containerId} />;
    return null;
  }

  return <div className={className}>{web}</div>;
}
