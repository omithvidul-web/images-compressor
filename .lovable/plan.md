# Image Compressor — Build Plan

A mobile-first, premium-styled image compression tool that runs entirely client-side, with a hidden admin panel to manage Adsterra redirect links.

## Pages / Routes

- `/` — Home / compressor tool
- `/admin` — Hidden admin panel (email-gated)

## Core Features

**Compressor (home page)**
- Drag-and-drop + tap-to-upload card (JPG, PNG, WEBP)
- Quality presets: Low (40%) / Medium (70%) / High (90%) + fine slider (0–100%)
- Canvas-API compression in-browser (no upload to server)
- Side-by-side preview: original vs compressed thumbnail
- Stats row: original size, compressed size, % saved, simple bar chart
- Loading spinner during processing
- Batch mode: queue multiple files, compress all, download each
- "Download Image" button → triggers Adsterra flow

**Adsterra Download Flow**
1. User clicks Download
2. If ads enabled and at least one active link exists, open the Adsterra direct link in a new tab (`window.open`)
3. Immediately (same click) trigger the blob download in the current tab so the user always gets their file
4. Rotate through multiple links round-robin (counter in localStorage)
5. If ads disabled or no links configured → download directly

**Admin Panel (`/admin`)**
- Email gate: enter email; access granted only if `email === "omithvidul@gmail.com"`
- Optional password field (stored hashed in localStorage; settable on first visit)
- Session flag kept in `sessionStorage`
- Manage Adsterra links: add / edit / delete (list with inline editing)
- Global toggle: Ads enabled / disabled
- Redirect behavior selector: new tab (default) vs same tab with return
- All settings persisted to `localStorage` under a single namespaced key

## Design

- Theme inspired by the uploaded logo: blue → cyan → green gradient accents on a near-white surface (dark mode toggle)
- Premium SaaS feel: generous spacing, soft shadows, rounded-2xl cards, subtle gradient borders
- Uploaded logo used in the header (saved as a Lovable asset, referenced by URL)
- Framer-motion-style entrance animations on cards and result panel
- Fully responsive; mobile-first layout (stacked), desktop shows original/compressed side-by-side
- Dark mode toggle in header

## Technical Notes

- Stack: TanStack Start (project default) with React + Tailwind v4 design tokens — not raw HTML/CSS/JS, since this is the framework the project is built on. All compression logic is still vanilla client-side Canvas API.
- New routes: `src/routes/index.tsx` (replace placeholder) and `src/routes/admin.tsx`
- Components: `UploadCard`, `QualityControls`, `ResultPanel`, `BatchList`, `AdminGate`, `AdLinkManager`
- Compression util: `src/lib/compress.ts` — loads file → `<img>` → draw to canvas → `canvas.toBlob(..., 'image/jpeg'|'image/webp', quality)`; PNG falls back to WEBP for real savings (configurable)
- Storage keys: `ic.settings` (ads enabled, redirect mode, link rotation index), `ic.links` (array), `ic.admin.pw` (optional)
- Design tokens (gradient, shadows, brand colors) added to `src/styles.css` `@theme`
- Logo registered via `lovable-assets` from the upload, imported as JSON pointer

## Out of Scope

- No backend / Lovable Cloud (everything client-side as requested)
- No real auth — email check is client-side only (matches the spec; this is not a security boundary, just obscurity)

## Open Question

The spec says "return to site, then trigger download" but browsers block that pattern reliably. Plan uses the standard publisher-friendly approach: open ad in a new tab AND start the download in the same click. Let me know if you'd prefer a delayed/interstitial pattern instead.