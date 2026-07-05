// Inline SVG logo as a base64 data URI — no network fetch needed.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="50%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#g)"/>
  <path d="M16 42 L26 30 L34 38 L42 26 L50 42 Z" fill="white" opacity="0.95"/>
  <circle cx="42" cy="22" r="4" fill="white"/>
</svg>`;

export const logoDataUri = `data:image/svg+xml;base64,${typeof window === "undefined" ? Buffer.from(svg).toString("base64") : btoa(svg)}`;
