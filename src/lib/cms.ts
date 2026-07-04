// Local CMS + monetization storage (localStorage). No backend.

export type MenuItem = {
  id: string;
  title: string;
  route: string;
  enabled: boolean;
  order: number;
};

export type PageKey = "home" | "about" | "contact" | "privacy" | "terms";

export type PageContent = {
  title: string;
  subtitle?: string;
  body: string; // markdown-lite / plain text (rendered as paragraphs)
};

export type AdSenseUnit = {
  id: string;
  name: string;
  type: "display" | "responsive" | "in-article" | "in-feed";
  client: string; // ca-pub-xxxx
  slot: string;
  location: "header" | "sidebar" | "in-content" | "footer";
  enabled: boolean;
};

export type AdsterraUnit = {
  id: string;
  name: string;
  type: "popunder" | "social-bar" | "native-banner" | "direct-link";
  code: string; // raw script or direct URL
  enabled: boolean;
  cooldownSec: number; // for popunder / direct-link
};

const K = {
  menu: "ic.cms.menu",
  pages: "ic.cms.pages",
  adsense: "ic.cms.adsense",
  adsterra: "ic.cms.adsterra",
  adsterraLast: "ic.cms.adsterra.last",
};

// ---------- Defaults ----------

export const DEFAULT_MENU: MenuItem[] = [
  { id: "m-home", title: "Home", route: "/", enabled: true, order: 0 },
  { id: "m-about", title: "About", route: "/about", enabled: true, order: 1 },
  { id: "m-contact", title: "Contact", route: "/contact", enabled: true, order: 2 },
  { id: "m-privacy", title: "Privacy Policy", route: "/privacy", enabled: true, order: 3 },
  { id: "m-terms", title: "Terms of Service", route: "/terms", enabled: true, order: 4 },
];

export const DEFAULT_PAGES: Record<PageKey, PageContent> = {
  home: {
    title: "Image Compressor",
    subtitle: "Fast, free, private in-browser image compression.",
    body: "Shrink JPG, PNG, and WEBP files instantly. Nothing leaves your device.",
  },
  about: {
    title: "About Us",
    subtitle: "Why we built Image Compressor",
    body: "Image Compressor is a lightweight, privacy-first tool that helps you reduce image file sizes right in your browser. No accounts, no uploads, no tracking of your files.\n\nOur mission is to make image optimization effortless for creators, developers, and everyday users on any device.",
  },
  contact: {
    title: "Contact",
    subtitle: "We'd love to hear from you",
    body: "For questions, feedback, or partnership inquiries, please reach out via email.\n\nEmail: support@example.com\n\nWe usually respond within 2 business days.",
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "Last updated: today",
    body: "We do not collect, store, or transmit the images you compress. All processing happens locally in your browser.\n\nWe may use third-party advertising partners (such as Google AdSense and Adsterra) which may set cookies to serve relevant ads. You can control cookies through your browser settings.\n\nAnalytics: we may collect anonymous, aggregated usage data to improve the service.\n\nFor privacy inquiries: privacy@example.com",
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Last updated: today",
    body: "By using Image Compressor you agree to these terms.\n\n1. The service is provided 'as is' without warranties of any kind.\n2. You are responsible for the content you process and must own the rights to it.\n3. We are not liable for any data loss or damage arising from the use of this service.\n4. We may update these terms at any time; continued use constitutes acceptance.",
  },
};

// ---------- Helpers ----------

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
}

// ---------- Menu ----------

export function getMenu(): MenuItem[] {
  const items = read<MenuItem[]>(K.menu, DEFAULT_MENU);
  return [...items].sort((a, b) => a.order - b.order);
}
export function saveMenu(items: MenuItem[]) {
  write(K.menu, items);
}

// ---------- Pages ----------

export function getPage(key: PageKey): PageContent {
  const all = read<Record<PageKey, PageContent>>(K.pages, DEFAULT_PAGES);
  return all[key] ?? DEFAULT_PAGES[key];
}
export function getAllPages(): Record<PageKey, PageContent> {
  return read<Record<PageKey, PageContent>>(K.pages, DEFAULT_PAGES);
}
export function savePage(key: PageKey, content: PageContent) {
  const all = getAllPages();
  all[key] = content;
  write(K.pages, all);
}

// ---------- AdSense ----------

export function getAdSense(): AdSenseUnit[] {
  return read<AdSenseUnit[]>(K.adsense, []);
}
export function saveAdSense(units: AdSenseUnit[]) {
  write(K.adsense, units);
}
export function getAdSenseByLocation(loc: AdSenseUnit["location"]): AdSenseUnit[] {
  return getAdSense().filter((u) => u.enabled && u.location === loc);
}

// ---------- Adsterra ----------

export function getAdsterra(): AdsterraUnit[] {
  return read<AdsterraUnit[]>(K.adsterra, []);
}
export function saveAdsterra(units: AdsterraUnit[]) {
  write(K.adsterra, units);
}

export function triggerAdsterra(type: AdsterraUnit["type"]): AdsterraUnit | null {
  if (typeof window === "undefined") return null;
  const units = getAdsterra().filter((u) => u.enabled && u.type === type);
  if (!units.length) return null;
  const now = Date.now();
  const last = read<Record<string, number>>(K.adsterraLast, {});
  const unit = units[0];
  const cooldownMs = Math.max(0, unit.cooldownSec) * 1000;
  if (last[unit.id] && now - last[unit.id] < cooldownMs) return null;
  last[unit.id] = now;
  write(K.adsterraLast, last);
  return unit;
}
