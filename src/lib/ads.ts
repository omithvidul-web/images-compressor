export type AdLink = {
  id: string;
  label: string;
  url: string;
  active: boolean;
};

export type AdSettings = {
  enabled: boolean;
  redirectMode: "new-tab" | "same-tab";
  rotationIndex: number;
};

const LINKS_KEY = "ic.links";
const SETTINGS_KEY = "ic.settings";
const ADMIN_PW_KEY = "ic.admin.pw";
const ADMIN_EMAIL = "omithvidul@gmail.com";

export const getAdminEmail = () => ADMIN_EMAIL;

export function getLinks(): AdLink[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LINKS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveLinks(links: AdLink[]) {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links));
}

export function getSettings(): AdSettings {
  if (typeof window === "undefined") {
    return { enabled: true, redirectMode: "new-tab", rotationIndex: 0 };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { enabled: true, redirectMode: "new-tab", rotationIndex: 0 };
    return { enabled: true, redirectMode: "new-tab", rotationIndex: 0, ...JSON.parse(raw) };
  } catch {
    return { enabled: true, redirectMode: "new-tab", rotationIndex: 0 };
  }
}

export function saveSettings(s: AdSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function nextAdLink(): AdLink | null {
  const settings = getSettings();
  if (!settings.enabled) return null;
  const active = getLinks().filter((l) => l.active && l.url.trim());
  if (active.length === 0) return null;
  const idx = settings.rotationIndex % active.length;
  saveSettings({ ...settings, rotationIndex: (idx + 1) % active.length });
  return active[idx];
}

export function getAdminPassword(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_PW_KEY);
}

export function setAdminPassword(pw: string) {
  localStorage.setItem(ADMIN_PW_KEY, pw);
}
