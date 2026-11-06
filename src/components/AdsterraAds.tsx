import { useEffect } from "react";
import { useIsAndroidApp } from "@/lib/platform";

export const ADSTERRA_DIRECT_LINK = "https://ardance.org/4/a7b9e1112c208fef4c4c0484d460b7ee";

const GLOBAL_SCRIPTS = [
  "https://accountut.com/1/d5212df9af7f4f3762c5cd19506cf976", // Popunder
  "https://bellnewyork.org/14/8259319c3c48510660f4a3d487868fea", // Social bar
];

/** Popunder + Social Bar, loaded once site-wide (browser only, not in Android app). */
export function AdsterraGlobal() {
  const isApp = useIsAndroidApp();
  useEffect(() => {
    if (isApp) return;
    GLOBAL_SCRIPTS.forEach((src) => {
      if (document.querySelector(`script[src="${src}"]`)) return;
      const s = document.createElement("script");
      s.src = src;
      s.setAttribute("data-cfasync", "false");
      document.body.appendChild(s);
    });
  }, [isApp]);
  return null;
}

const NATIVE_ID = "34e97d02e3130362697b0ab00c0e4a7a";

export function AdsterraNativeBanner({ className }: { className?: string }) {
  const isApp = useIsAndroidApp();
  useEffect(() => {
    if (isApp) return;
    const src = `https://bellnewyork.org/21/${NATIVE_ID}`;
    document.querySelector(`script[src="${src}"]`)?.remove();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.setAttribute("data-cfasync", "false");
    document.body.appendChild(s);
  }, [isApp]);
  if (isApp) return null;
  return <div className={className} id={`container-${NATIVE_ID}`} />;
}

const BANNER_HTML = `<!doctype html><html><head><style>html,body{margin:0;padding:0;overflow:hidden}</style></head><body>
<script>atOptions={'key':'ca0cfbe19d40c96860b21eeabdcd4ac0','format':'iframe','height':50,'width':320,'params':{}};</script>
<script src="https://bellnewyork.org/22/ca0cfbe19d40c96860b21eeabdcd4ac0"></script></body></html>`;

export function AdsterraBanner320({ className }: { className?: string }) {
  const isApp = useIsAndroidApp();
  if (isApp) return null;
  return (
    <div className={`flex justify-center ${className ?? ""}`}>
      <iframe
        title="Advertisement"
        srcDoc={BANNER_HTML}
        width={320}
        height={50}
        scrolling="no"
        className="border-0"
      />
    </div>
  );
}
