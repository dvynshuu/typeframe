# Typeframe Architecture

> **Full architecture & technical audit:** [docs/ARCHITECTURE-AUDIT.md](./docs/ARCHITECTURE-AUDIT.md)  
> (module map, data flows, performance/security/accessibility audit, technical debt, priorities)

## Product analysis

Typeframe is a **typography-first creative surface**: users write text, pick a template and theme, and export pixel-perfect shareable images. The experience should feel like Linear or Arc—fast, minimal, editorial—not a bloated design SaaS.

Core user loop: **edit text → see instant preview → tune type & background → export**.

---

## Folder structure

| Folder | Purpose |
|--------|---------|
| `src/components/` | Astro UI shells and client islands (`Editor.astro`, `EditorApp.ts`) |
| `src/pages/` | Routes; static `index.astro` entry |
| `src/layouts/` | HTML document shell, fonts, meta |
| `src/styles/` | Design tokens, global CSS, editor layout (vanilla CSS) |
| `src/lib/` | Domain logic: renderers, themes, templates, state, auto-layout |
| `src/hooks/` | Client scheduling: debounce, rAF render loop |
| `src/utils/` | Pure helpers: text parsing, export, DOM download |
| `src/types/` | Shared TypeScript contracts |
| `src/workers/` | OffscreenCanvas export worker (non-blocking raster export) |

---

## Rendering approach

### Dual pipeline

1. **Canvas (primary preview + raster export)**  
   - Live preview on `#preview-canvas`  
   - Full backgrounds: mesh, gradient, noise, images  
   - `requestAnimationFrame` throttling via `createRenderLoop`

2. **SVG (vector export)**  
   - `renderToSvg()` for downloadable `.svg`  
   - Crisp text paths, smaller files for type-heavy artboards

### Canvas vs SVG tradeoffs

| Dimension | Canvas | SVG |
|-----------|--------|-----|
| **Live preview FPS** | Excellent — single 2D context, GPU-friendly blits | Slower DOM/string rebuild per frame |
| **Effects (noise, mesh, blur)** | Native gradients + pixel noise | Approximated with filters; heavier |
| **Text fidelity** | Good; depends on devicePixelRatio | Perfect at any zoom |
| **Export scalability** | Fixed resolution (needs scale factor) | Infinite; ideal for print |
| **File size** | Larger for photos; fine for social sizes | Smaller for text-only cards |
| **Worker / Offscreen** | Supported (`export.worker.ts`) | String generation on main thread is cheap |

**Decision:** Canvas for **preview and PNG/JPEG/WebP**; SVG for **vector export**. This matches performance goals (FCP/LCP on static shell + one island) and product needs (social raster + optional SVG).

---

## Performance strategy

- **Astro static shell** — HTML/CSS shipped with zero JS until island hydrates  
- **Single island** — `Editor` with `client:load`; no framework runtime  
- **Dynamic import** — export worker loaded only when needed  
- **Font loading** — `media="print"` swap pattern; `display=swap`  
- **Debounced / rAF rendering** — no render storm on slider input  
- **Preview scale** — canvas drawn at logical size, displayed smaller (fewer pixels on screen)  
- **compressHTML + inlineStylesheets** — smaller critical path  
- **CLS 0** — reserved preview area, no layout-shifting ads/widgets  

Targets: Lighthouse 95+, FCP &lt; 1s, LCP &lt; 2s on production build with CDN fonts.

---

## Auto layout

`computeAutoLayout()` picks block geometry from:

- Template `layoutHint` (centered / editorial / code / social)
- Content length and line count
- Markdown code fences → code card

Users can override via **drag** and **resize handles** on the preview overlay.

---

## State

`EditorStore` is a lightweight pub/sub store (no external state library). Template/theme changes re-run auto-layout; typography/background merge from theme defaults.

---

## Implementation plan (completed)

1. Scaffold Astro + TypeScript  
2. Types, themes, templates, typography tokens  
3. Background + Canvas + SVG renderers  
4. Auto-layout + editor store  
5. Editor UI (three-column Linear-inspired chrome)  
6. Drag/resize overlay, export pipeline  
7. Worker stub for Offscreen export  
8. Documentation (this file)
