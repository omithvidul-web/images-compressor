import { useEffect, useState } from "react";

export const ANDROID_APP_UA_TOKEN = "ImageCompressorAndroidApp";

/** True when the current page is loaded inside our Android WebView shell. */
export function isAndroidApp(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.userAgent.includes(ANDROID_APP_UA_TOKEN);
}

/** Bridge injected by the Android WebView. All methods are optional. */
export type AndroidBridge = {
  showBanner?: (adUnitId: string) => void;
  hideBanner?: () => void;
  showInterstitial?: (adUnitId: string) => void;
  showRewarded?: (adUnitId: string) => void;
  showRewardedInterstitial?: (adUnitId: string) => void;
  showAppOpen?: (adUnitId: string) => void;
  loadNative?: (adUnitId: string, containerId: string) => void;
};

declare global {
  interface Window {
    AndroidBridge?: AndroidBridge;
  }
}

export function getAndroidBridge(): AndroidBridge | null {
  if (typeof window === "undefined") return null;
  return window.AndroidBridge ?? null;
}

/** SSR-safe hook: returns true only after mount when running inside the Android WebView. */
export function useIsAndroidApp(): boolean {
  const [is, setIs] = useState(false);
  useEffect(() => {
    setIs(isAndroidApp());
  }, []);
  return is;
}
