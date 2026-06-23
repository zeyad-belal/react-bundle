# Bundle Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a data-driven, multi-step "bundle builder" (4-step accordion) with a live "Your security system" review panel that matches the provided screenshots, recalculates totals live, tracks per-variant quantities, and persists to localStorage.

**Architecture:** A static `catalog.json` drives all rendering. A small Zustand store holds only user-mutable state (`qty` keyed by `productId:variantId`, `activeVariant` per product, `openStepId`). Everything visible — review lines, "N selected" counts, totals/savings — is computed by pure selector functions so it can never drift from the source of truth. Persistence is the Zustand `persist` middleware → localStorage.

**Tech Stack:** Vite + React 19 + TypeScript, Zustand 5 (`persist`), Tailwind CSS v4 (`@tailwindcss/vite`), clsx, oxlint, Vitest + @testing-library/react.

## Global Constraints

- React 19, TypeScript, Vite — already scaffolded; do not change build tool.
- State: Zustand 5 only. Styling: Tailwind v4 utility classes (+ a few CSS vars for tokens). Conditional classes via `clsx`.
- **Data-driven:** no per-product hardcoded JSX. Cards/lines render by mapping over `catalog.json`.
- **Exact totals (must match):** active total **$187.89**, struck pre-discount **$238.81**, savings **$50.92**.
- Plan step is **single-select** (`selection: "single"`): radio cards, no quantity stepper, review line shows price only.
- **Sense Hub is required:** quantity clamps at min 1, its minus button is disabled.
- **FREE** items: `price: 0` with non-null `compareAt`; render the word "FREE" in accent color.
- Accordion is **single-open**; step 1 (`cameras`) is open on load.
- **"N selected"** = number of distinct products in that step with total qty > 0 (a product with two colors both > 0 counts once).
- Persist `{ qty, activeVariant, openStepId }` to localStorage key `wyze-bundle-v1`; state restores on reload.
- Responsive: desktop (≥1024px) = sticky right sidebar, cards 2-up; tablet (640–1024px) = review stacked below; mobile (<640px) = single column.
- Accent color `#4B36CD` (indigo), panel bg `#F4F6FF`, savings green `#1F9D57` (all tuned to screenshot during execution). Exact hex/spacing are screenshot estimates.

---

### Task 0: Project setup — Tailwind, Vitest, theme tokens, clean scaffold

**Files:**
- Modify: `vite.config.ts`
- Modify: `src/index.css`
- Modify: `package.json` (scripts + dev deps)
- Create: `vitest.config.ts`, `src/test/setup.ts`
- Delete: `src/App.css`, `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png`, `public/icons.svg`
- Replace: `src/App.tsx` (temporary clean shell), `index.html` (title)

**Interfaces:**
- Produces: working `npm run dev` (blank styled page), working `npm test`, Tailwind utilities + CSS-var tokens available app-wide.

- [ ] **Step 1: Add Tailwind plugin to Vite**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

- [ ] **Step 2: Replace `src/index.css` with Tailwind import + theme tokens**

```css
@import 'tailwindcss';

@theme {
  --color-accent: #4b36cd;
  --color-accent-soft: #ece9fb;
  --color-panel: #f4f6ff;
  --color-ink: #15131a;
  --color-muted: #6b6675;
  --color-line: #e6e5ea;
  --color-save: #1f9d57;
  --radius-card: 14px;
}

:root { color-scheme: light; }
html, body, #root { height: 100%; }
body { margin: 0; background: #fff; color: var(--color-ink);
  font-family: ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased; }
```

- [ ] **Step 3: Install test deps and add scripts**

Run:
```bash
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```
Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 4: Create `vitest.config.ts` and `src/test/setup.ts`**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'] },
})
```
`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 5: Clean template boilerplate**

Delete the files listed above. Replace `src/App.tsx` with a temporary shell:
```tsx
export default function App() {
  return <div className="p-8 text-accent">Bundle builder — setup OK</div>
}
```
Set `<title>Wyze Bundle Builder</title>` in `index.html`.

- [ ] **Step 6: Verify dev + test run**

Run: `npm run dev` → page shows indigo "setup OK" text (Tailwind working).
Run: `npm test` → exits 0 (no tests yet is fine: add `--passWithNoTests` to the script if needed).

- [ ] **Step 7: Commit**
```bash
git add -A && git commit -m "chore: wire tailwind v4 + vitest, clean scaffold"
```

---

### Task 1: Types + full `catalog.json`

**Files:**
- Create: `src/types.ts`, `src/data/catalog.json`
- Test: `src/data/catalog.test.ts`

**Interfaces:**
- Produces: `Variant`, `Product`, `Step`, `SummaryConfig`, `SeedItem`, `Catalog` types; `vkey(productId, variantId)` helper; the seeded data driving the whole app.

- [ ] **Step 1: Write `src/types.ts`**
```ts
export interface Variant {
  id: string
  label: string
  swatch: string          // hex for the chip dot
  price: number           // active unit price
  compareAt: number | null // struck unit price; null = no discount
}
export interface Product {
  id: string
  name: string
  badge?: string          // e.g. "Save 22%"
  description?: string
  learnMoreUrl?: string
  image: string           // /products/<id>.svg
  priceUnit: 'each' | 'mo'
  required?: boolean       // true => min qty 1, minus disabled
  variants: Variant[]      // always >= 1 (no-color products get one 'default')
}
export type SelectionMode = 'quantity' | 'single'
export interface Step {
  id: string
  title: string
  icon: string            // icon key
  reviewCategory: string  // grouping header in review panel
  selection: SelectionMode
  nextLabel?: string      // text for the "Next: …" button
  productIds: string[]
}
export interface SummaryConfig {
  shipping: { label: string; price: number; compareAt: number }
  guarantee: { percent: string; title: string; blurb: string }
  financingLabel: string  // "as low as $19.19/mo"
}
export interface SeedItem { productId: string; variantId: string; qty: number }
export interface Catalog {
  steps: Step[]
  products: Record<string, Product>
  summary: SummaryConfig
  seed: SeedItem[]
}
export const vkey = (productId: string, variantId: string) => `${productId}:${variantId}`
```

- [ ] **Step 2: Write `src/data/catalog.json`** (exact prices locked to match totals)
```json
{
  "steps": [
    { "id": "cameras", "title": "Choose your cameras", "icon": "camera", "reviewCategory": "Cameras", "selection": "quantity", "nextLabel": "Next: Choose your plan",
      "productIds": ["wyze-cam-v4", "wyze-cam-pan-v3", "wyze-cam-floodlight-v2", "wyze-duo-cam-doorbell", "wyze-battery-cam-pro"] },
    { "id": "plan", "title": "Choose your plan", "icon": "shield", "reviewCategory": "Plan", "selection": "single", "nextLabel": "Next: Choose your sensors",
      "productIds": ["cam-unlimited", "cam-plus", "cam-basic"] },
    { "id": "sensors", "title": "Choose your sensors", "icon": "sensor", "reviewCategory": "Sensors", "selection": "quantity", "nextLabel": "Next: Add extra protection",
      "productIds": ["wyze-sense-motion", "wyze-sense-hub", "wyze-sense-entry", "wyze-sense-leak"] },
    { "id": "extra", "title": "Add extra protection", "icon": "grid", "reviewCategory": "Accessories", "selection": "quantity",
      "productIds": ["wyze-microsd-256", "wyze-microsd-32", "wyze-solar-panel"] }
  ],
  "products": {
    "wyze-cam-v4": { "id": "wyze-cam-v4", "name": "Wyze Cam v4", "badge": "Save 22%", "description": "The clearest Wyze Cam ever made.", "learnMoreUrl": "#", "image": "/products/wyze-cam-v4.svg", "priceUnit": "each",
      "variants": [
        { "id": "white", "label": "White", "swatch": "#ffffff", "price": 27.98, "compareAt": 35.98 },
        { "id": "grey", "label": "Grey", "swatch": "#9aa0a6", "price": 27.98, "compareAt": 35.98 },
        { "id": "black", "label": "Black", "swatch": "#1b1b1f", "price": 27.98, "compareAt": 35.98 } ] },
    "wyze-cam-pan-v3": { "id": "wyze-cam-pan-v3", "name": "Wyze Cam Pan v3", "badge": "Save 12%", "description": "360° pan and 180° tilt security camera.", "learnMoreUrl": "#", "image": "/products/wyze-cam-pan-v3.svg", "priceUnit": "each",
      "variants": [
        { "id": "white", "label": "White", "swatch": "#ffffff", "price": 23.99, "compareAt": 28.99 },
        { "id": "black", "label": "Black", "swatch": "#1b1b1f", "price": 23.99, "compareAt": 28.99 } ] },
    "wyze-cam-floodlight-v2": { "id": "wyze-cam-floodlight-v2", "name": "Wyze Cam Floodlight v2", "badge": "Save 22%", "description": "2K floodlight camera with a 160° wide-angle view for your garage.", "learnMoreUrl": "#", "image": "/products/wyze-cam-floodlight-v2.svg", "priceUnit": "each",
      "variants": [
        { "id": "white", "label": "White", "swatch": "#ffffff", "price": 69.98, "compareAt": 89.98 },
        { "id": "black", "label": "Black", "swatch": "#1b1b1f", "price": 69.98, "compareAt": 89.98 } ] },
    "wyze-duo-cam-doorbell": { "id": "wyze-duo-cam-doorbell", "name": "Wyze Duo Cam Doorbell", "description": "Two cameras. Two views. Double the porch protection.", "learnMoreUrl": "#", "image": "/products/wyze-duo-cam-doorbell.svg", "priceUnit": "each",
      "variants": [ { "id": "default", "label": "", "swatch": "#1b1b1f", "price": 69.98, "compareAt": null } ] },
    "wyze-battery-cam-pro": { "id": "wyze-battery-cam-pro", "name": "Wyze Battery Cam Pro", "description": "Protect anywhere. See everything in 2.5K HDR. No power outlet or electrician needed.", "learnMoreUrl": "#", "image": "/products/wyze-battery-cam-pro.svg", "priceUnit": "each",
      "variants": [
        { "id": "white", "label": "White", "swatch": "#ffffff", "price": 89.98, "compareAt": null },
        { "id": "black", "label": "Black", "swatch": "#1b1b1f", "price": 89.98, "compareAt": null } ] },

    "cam-unlimited": { "id": "cam-unlimited", "name": "Cam Unlimited", "description": "Unlimited cameras. Person, pet, package & vehicle detection.", "image": "/products/plan-unlimited.svg", "priceUnit": "mo",
      "variants": [ { "id": "default", "label": "", "swatch": "#4b36cd", "price": 9.99, "compareAt": 12.99 } ] },
    "cam-plus": { "id": "cam-plus", "name": "Cam Plus", "description": "Per-camera AI events and 14-day history.", "image": "/products/plan-plus.svg", "priceUnit": "mo",
      "variants": [ { "id": "default", "label": "", "swatch": "#4b36cd", "price": 1.99, "compareAt": 2.99 } ] },
    "cam-basic": { "id": "cam-basic", "name": "Cam Basic", "description": "Free 12-second event clips, no subscription.", "image": "/products/plan-basic.svg", "priceUnit": "mo",
      "variants": [ { "id": "default", "label": "", "swatch": "#9aa0a6", "price": 0, "compareAt": null } ] },

    "wyze-sense-motion": { "id": "wyze-sense-motion", "name": "Wyze Sense Motion Sensor", "description": "Detects motion and triggers alerts and automations.", "image": "/products/sense-motion.svg", "priceUnit": "each",
      "variants": [ { "id": "default", "label": "", "swatch": "#ffffff", "price": 29.99, "compareAt": null } ] },
    "wyze-sense-hub": { "id": "wyze-sense-hub", "name": "Wyze Sense Hub", "description": "Required base station that connects your sensors.", "image": "/products/sense-hub.svg", "priceUnit": "each", "required": true,
      "variants": [ { "id": "default", "label": "", "swatch": "#ffffff", "price": 0, "compareAt": 29.92 } ] },
    "wyze-sense-entry": { "id": "wyze-sense-entry", "name": "Wyze Sense Entry Sensor", "description": "Know when doors and windows open.", "image": "/products/sense-entry.svg", "priceUnit": "each",
      "variants": [ { "id": "default", "label": "", "swatch": "#ffffff", "price": 19.99, "compareAt": null } ] },
    "wyze-sense-leak": { "id": "wyze-sense-leak", "name": "Wyze Sense Leak Sensor", "description": "Catch leaks before they become floods.", "image": "/products/sense-leak.svg", "priceUnit": "each",
      "variants": [ { "id": "default", "label": "", "swatch": "#ffffff", "price": 21.99, "compareAt": null } ] },

    "wyze-microsd-256": { "id": "wyze-microsd-256", "name": "Wyze MicroSD Card (256GB)", "description": "Local 24/7 continuous recording storage.", "image": "/products/microsd-256.svg", "priceUnit": "each",
      "variants": [ { "id": "default", "label": "", "swatch": "#1b1b1f", "price": 20.98, "compareAt": null } ] },
    "wyze-microsd-32": { "id": "wyze-microsd-32", "name": "Wyze MicroSD Card (32GB)", "description": "Local storage for shorter recording windows.", "image": "/products/microsd-32.svg", "priceUnit": "each",
      "variants": [ { "id": "default", "label": "", "swatch": "#1b1b1f", "price": 5.99, "compareAt": null } ] },
    "wyze-solar-panel": { "id": "wyze-solar-panel", "name": "Wyze Solar Panel", "description": "Keep battery cameras charged with the sun.", "image": "/products/solar-panel.svg", "priceUnit": "each",
      "variants": [ { "id": "default", "label": "", "swatch": "#1b1b1f", "price": 29.98, "compareAt": null } ] }
  },
  "summary": {
    "shipping": { "label": "Fast Shipping", "price": 0, "compareAt": 5.99 },
    "guarantee": { "percent": "100%", "title": "30-day hassle-free returns", "blurb": "If you're not totally in love with the product, we will refund you 100%." },
    "financingLabel": "as low as $19.19/mo"
  },
  "seed": [
    { "productId": "wyze-cam-v4", "variantId": "white", "qty": 1 },
    { "productId": "wyze-cam-pan-v3", "variantId": "white", "qty": 2 },
    { "productId": "cam-unlimited", "variantId": "default", "qty": 1 },
    { "productId": "wyze-sense-motion", "variantId": "default", "qty": 2 },
    { "productId": "wyze-sense-hub", "variantId": "default", "qty": 1 },
    { "productId": "wyze-microsd-256", "variantId": "default", "qty": 2 }
  ]
}
```

- [ ] **Step 3: Write integrity test `src/data/catalog.test.ts`**
```ts
import { describe, it, expect } from 'vitest'
import catalogJson from './catalog.json'
import type { Catalog } from '../types'
const catalog = catalogJson as Catalog

describe('catalog integrity', () => {
  it('every step productId resolves to a product', () => {
    for (const step of catalog.steps)
      for (const id of step.productIds) expect(catalog.products[id]).toBeDefined()
  })
  it('every product has at least one variant', () => {
    for (const p of Object.values(catalog.products)) expect(p.variants.length).toBeGreaterThan(0)
  })
  it('every seed item resolves to a real product+variant', () => {
    for (const s of catalog.seed) {
      const p = catalog.products[s.productId]
      expect(p).toBeDefined()
      expect(p.variants.find((v) => v.id === s.variantId)).toBeDefined()
    }
  })
})
```

- [ ] **Step 4: Enable JSON import** — ensure `tsconfig.app.json` has `"resolveJsonModule": true` (add under compilerOptions if missing). Run: `npm test` → 3 passing.

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat: add catalog types and seeded data"
```

---

### Task 2: Zustand store (TDD)

**Files:**
- Create: `src/store/useBundleStore.ts`
- Test: `src/store/useBundleStore.test.ts`

**Interfaces:**
- Consumes: `Catalog`, `vkey` from `../types`; `catalog.json`.
- Produces: `useBundleStore` with state `{ qty, activeVariant, openStepId, saved }` and actions `setQty(p,v,n)`, `increment(p,v)`, `decrement(p,v)`, `selectVariant(p,v)`, `selectSingle(stepId, productId)`, `openStep(stepId)`, `saveForLater()`, `reset()`. Helper exports `minQty(productId)`.

> **Learning checkpoint:** `setQty`/`decrement` (variant-qty + required clamp) is the assignment's core logic. During execution, offer the user to write these from the test + signature before falling back to the reference below.

- [ ] **Step 1: Write failing tests `src/store/useBundleStore.test.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useBundleStore } from './useBundleStore'
import { vkey } from '../types'

const reset = () => useBundleStore.getState().reset()
const q = (p: string, v: string) => useBundleStore.getState().qty[vkey(p, v)] ?? 0

describe('bundle store', () => {
  beforeEach(() => reset())

  it('seeds initial quantities from catalog', () => {
    expect(q('wyze-cam-v4', 'white')).toBe(1)
    expect(q('wyze-cam-pan-v3', 'white')).toBe(2)
  })

  it('tracks variants independently', () => {
    const { setQty } = useBundleStore.getState()
    setQty('wyze-cam-v4', 'white', 2)
    setQty('wyze-cam-v4', 'black', 5)
    expect(q('wyze-cam-v4', 'white')).toBe(2)
    expect(q('wyze-cam-v4', 'black')).toBe(5)
  })

  it('decrement clamps at 0 for normal products', () => {
    const { decrement } = useBundleStore.getState()
    decrement('wyze-cam-floodlight-v2', 'white') // starts at 0
    expect(q('wyze-cam-floodlight-v2', 'white')).toBe(0)
  })

  it('required product (Sense Hub) clamps at min 1', () => {
    const { decrement } = useBundleStore.getState()
    decrement('wyze-sense-hub', 'default')
    expect(q('wyze-sense-hub', 'default')).toBe(1)
  })

  it('single-select plan: choosing one zeroes the others', () => {
    const { selectSingle } = useBundleStore.getState()
    selectSingle('plan', 'cam-plus')
    expect(q('cam-plus', 'default')).toBe(1)
    expect(q('cam-unlimited', 'default')).toBe(0)
  })

  it('openStep toggles single-open; default is cameras', () => {
    expect(useBundleStore.getState().openStepId).toBe('cameras')
    useBundleStore.getState().openStep('plan')
    expect(useBundleStore.getState().openStepId).toBe('plan')
    useBundleStore.getState().openStep('plan')
    expect(useBundleStore.getState().openStepId).toBe('')
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**
Run: `npm test -- src/store/useBundleStore.test.ts`
Expected: FAIL ("Cannot find module './useBundleStore'").

- [ ] **Step 3: Implement `src/store/useBundleStore.ts`**
```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import catalogJson from '../data/catalog.json'
import { type Catalog, vkey } from '../types'

const catalog = catalogJson as Catalog

export const minQty = (productId: string) =>
  catalog.products[productId]?.required ? 1 : 0

function seededQty(): Record<string, number> {
  const qty: Record<string, number> = {}
  for (const s of catalog.seed) qty[vkey(s.productId, s.variantId)] = s.qty
  return qty
}
function defaultActive(): Record<string, string> {
  const active: Record<string, string> = {}
  for (const p of Object.values(catalog.products)) active[p.id] = p.variants[0].id
  for (const s of catalog.seed) active[s.productId] = s.variantId
  return active
}

interface BuilderState {
  qty: Record<string, number>
  activeVariant: Record<string, string>
  openStepId: string
  saved: boolean
  setQty: (productId: string, variantId: string, n: number) => void
  increment: (productId: string, variantId: string) => void
  decrement: (productId: string, variantId: string) => void
  selectVariant: (productId: string, variantId: string) => void
  selectSingle: (stepId: string, productId: string) => void
  openStep: (stepId: string) => void
  saveForLater: () => void
  reset: () => void
}

export const useBundleStore = create<BuilderState>()(
  persist(
    (set, get) => ({
      qty: seededQty(),
      activeVariant: defaultActive(),
      openStepId: catalog.steps[0].id,
      saved: false,

      setQty: (productId, variantId, n) =>
        set((s) => ({
          qty: { ...s.qty, [vkey(productId, variantId)]: Math.max(minQty(productId), n) },
        })),
      increment: (p, v) => get().setQty(p, v, (get().qty[vkey(p, v)] ?? 0) + 1),
      decrement: (p, v) => get().setQty(p, v, (get().qty[vkey(p, v)] ?? 0) - 1),

      selectVariant: (productId, variantId) =>
        set((s) => ({ activeVariant: { ...s.activeVariant, [productId]: variantId } })),

      selectSingle: (stepId, productId) =>
        set((s) => {
          const step = catalog.steps.find((st) => st.id === stepId)
          if (!step) return s
          const qty = { ...s.qty }
          for (const pid of step.productIds) {
            const vid = catalog.products[pid].variants[0].id
            qty[vkey(pid, vid)] = pid === productId ? 1 : 0
          }
          return { qty }
        }),

      openStep: (stepId) =>
        set((s) => ({ openStepId: s.openStepId === stepId ? '' : stepId })),

      saveForLater: () => set({ saved: true }),

      reset: () =>
        set({
          qty: seededQty(),
          activeVariant: defaultActive(),
          openStepId: catalog.steps[0].id,
          saved: false,
        }),
    }),
    {
      name: 'wyze-bundle-v1',
      partialize: (s) => ({
        qty: s.qty,
        activeVariant: s.activeVariant,
        openStepId: s.openStepId,
      }),
    },
  ),
)
```

- [ ] **Step 4: Run tests, verify pass**
Run: `npm test -- src/store/useBundleStore.test.ts` → all PASS.

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat: bundle store with variant qty, required clamp, single-select"
```

---

### Task 3: Derived selectors (TDD) — the exact totals

**Files:**
- Create: `src/store/selectors.ts`
- Test: `src/store/selectors.test.ts`

**Interfaces:**
- Consumes: `catalog.json`, `vkey`, `useBundleStore`.
- Produces: `ReviewLine` interface; pure fns `reviewLines(qty)`, `selectedCount(qty, stepId)`, `totals(qty) => { total, preDiscount, savings }`; React hooks `useReviewLines()`, `useGroupedReview()`, `useSelectedCount(stepId)`, `useTotals()`; `formatMoney(n)`.

> **Learning checkpoint:** `totals()` is meaningful business logic (which lines count, plan-included, rounding). Offer the user to write it from the test before falling back to the reference.

- [ ] **Step 1: Write failing tests `src/store/selectors.test.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useBundleStore } from './useBundleStore'
import { reviewLines, selectedCount, totals } from './selectors'

const qty = () => useBundleStore.getState().qty
beforeEach(() => useBundleStore.getState().reset())

describe('selectors (seeded design state)', () => {
  it('produces one review line per variant with qty > 0', () => {
    const lines = reviewLines(qty())
    // v4, pan v3, cam-unlimited, motion, hub, microsd-256 = 6 lines
    expect(lines).toHaveLength(6)
  })

  it('matches the design totals exactly', () => {
    const t = totals(qty())
    expect(t.total).toBe(187.89)
    expect(t.preDiscount).toBe(238.81)
    expect(t.savings).toBe(50.92)
  })

  it('recalculates when a quantity changes', () => {
    useBundleStore.getState().increment('wyze-cam-v4', 'white') // +27.98
    expect(totals(qty()).total).toBe(215.87)
  })

  it('"N selected" counts distinct products, not variant lines', () => {
    useBundleStore.getState().setQty('wyze-cam-v4', 'black', 3) // same product, 2nd variant
    expect(selectedCount(qty(), 'cameras')).toBe(2) // v4 + pan v3, still 2
    expect(selectedCount(qty(), 'sensors')).toBe(2) // motion + hub
    expect(selectedCount(qty(), 'plan')).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests, verify fail**
Run: `npm test -- src/store/selectors.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement `src/store/selectors.ts`**
```ts
import catalogJson from '../data/catalog.json'
import { type Catalog, vkey } from '../types'
import { useBundleStore } from './useBundleStore'

const catalog = catalogJson as Catalog
const round2 = (n: number) => Math.round(n * 100) / 100

export interface ReviewLine {
  productId: string
  variantId: string
  name: string
  image: string
  category: string
  selection: 'quantity' | 'single'
  unitPrice: number
  unitCompareAt: number | null
  qty: number
  lineTotal: number
  lineCompareAt: number
  priceUnit: 'each' | 'mo'
  required: boolean
}

export function reviewLines(qty: Record<string, number>): ReviewLine[] {
  const lines: ReviewLine[] = []
  for (const step of catalog.steps) {
    for (const pid of step.productIds) {
      const product = catalog.products[pid]
      for (const variant of product.variants) {
        const n = qty[vkey(pid, variant.id)] ?? 0
        if (n <= 0) continue
        lines.push({
          productId: pid,
          variantId: variant.id,
          name: product.name,
          image: product.image,
          category: step.reviewCategory,
          selection: step.selection,
          unitPrice: variant.price,
          unitCompareAt: variant.compareAt,
          qty: n,
          lineTotal: round2(variant.price * n),
          lineCompareAt: round2((variant.compareAt ?? variant.price) * n),
          priceUnit: product.priceUnit,
          required: !!product.required,
        })
      }
    }
  }
  return lines
}

export function selectedCount(qty: Record<string, number>, stepId: string): number {
  const step = catalog.steps.find((s) => s.id === stepId)
  if (!step) return 0
  let count = 0
  for (const pid of step.productIds) {
    const total = catalog.products[pid].variants.reduce(
      (sum, v) => sum + (qty[vkey(pid, v.id)] ?? 0), 0)
    if (total > 0) count++
  }
  return count
}

export interface Totals { total: number; preDiscount: number; savings: number }
export function totals(qty: Record<string, number>): Totals {
  const lines = reviewLines(qty)
  const total = round2(lines.reduce((s, l) => s + l.lineTotal, 0))
  const preDiscount = round2(lines.reduce((s, l) => s + l.lineCompareAt, 0))
  return { total, preDiscount, savings: round2(preDiscount - total) }
}

export function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

// Hooks (recompute per render; cheap at this scale)
export const useReviewLines = () => reviewLines(useBundleStore((s) => s.qty))
export const useSelectedCount = (stepId: string) =>
  selectedCount(useBundleStore((s) => s.qty), stepId)
export const useTotals = () => totals(useBundleStore((s) => s.qty))

export interface ReviewGroup { category: string; lines: ReviewLine[] }
export function useGroupedReview(): ReviewGroup[] {
  const lines = useReviewLines()
  const order: string[] = []
  const map = new Map<string, ReviewLine[]>()
  for (const l of lines) {
    if (!map.has(l.category)) { map.set(l.category, []); order.push(l.category) }
    map.get(l.category)!.push(l)
  }
  return order.map((category) => ({ category, lines: map.get(category)! }))
}
```

- [ ] **Step 4: Run tests, verify pass**
Run: `npm test -- src/store/selectors.test.ts` → all PASS (confirms $187.89/$238.81/$50.92).

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat: derived review/totals selectors matching design totals"
```

---

### Task 4: Shared primitives — icons, QtyStepper, PriceTag

**Files:**
- Create: `src/components/Icon.tsx`, `src/components/QtyStepper.tsx`, `src/components/PriceTag.tsx`
- Test: `src/components/QtyStepper.test.tsx`

**Interfaces:**
- Produces:
  - `<Icon name="camera|shield|sensor|grid|truck|chevron|minus|plus" className?/>`
  - `<QtyStepper value, onIncrement, onDecrement, minusDisabled?, size?='md'|'sm' />`
  - `<PriceTag price, compareAt, unit='each'|'mo', size? />` — renders struck `compareAt` + accent active price, or "FREE" when `price===0`.

- [ ] **Step 1: Write `src/components/Icon.tsx`** — inline SVG paths keyed by name (camera, shield, sensor, grid, truck, chevron, minus, plus). Each returns an `<svg>` with `currentColor` stroke. (Reference paths are simple 24×24 line icons; pick from any open set or hand-draw — they are small.)
```tsx
import type { SVGProps } from 'react'
const paths: Record<string, string> = {
  minus: 'M5 12h14',
  plus: 'M12 5v14M5 12h14',
  chevron: 'M6 9l6 6 6-6',
  camera: 'M3 8h3l2-2h8l2 2h3v11H3zM12 17a3 3 0 100-6 3 3 0 000 6z',
  shield: 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z',
  sensor: 'M12 12a3 3 0 100-6 3 3 0 000 6zM6 18c1.5-2 3.7-3 6-3s4.5 1 6 3',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  truck: 'M3 6h11v9H3zM14 9h4l3 3v3h-7zM7 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
}
export function Icon({ name, ...rest }: { name: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
      strokeLinecap="round" strokeLinejoin="round" width={20} height={20} {...rest}>
      <path d={paths[name] ?? ''} />
    </svg>
  )
}
```

- [ ] **Step 2: Write failing test `src/components/QtyStepper.test.tsx`**
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QtyStepper } from './QtyStepper'

describe('QtyStepper', () => {
  it('fires callbacks and disables minus when requested', async () => {
    const onInc = vi.fn(), onDec = vi.fn()
    render(<QtyStepper value={0} onIncrement={onInc} onDecrement={onDec} minusDisabled />)
    expect(screen.getByText('0')).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('Increase quantity'))
    expect(onInc).toHaveBeenCalledOnce()
    const minus = screen.getByLabelText('Decrease quantity')
    expect(minus).toBeDisabled()
  })
})
```

- [ ] **Step 3: Run test, verify fail** → FAIL (module missing).

- [ ] **Step 4: Implement `QtyStepper.tsx` and `PriceTag.tsx`**
```tsx
// QtyStepper.tsx
import clsx from 'clsx'
import { Icon } from './Icon'

interface Props {
  value: number
  onIncrement: () => void
  onDecrement: () => void
  minusDisabled?: boolean
  size?: 'md' | 'sm'
}
export function QtyStepper({ value, onIncrement, onDecrement, minusDisabled, size = 'md' }: Props) {
  const btn = clsx(
    'grid place-items-center rounded-md border border-line text-ink transition',
    'enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed',
    size === 'sm' ? 'h-6 w-6' : 'h-8 w-8',
  )
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={btn} aria-label="Decrease quantity"
        disabled={minusDisabled} onClick={onDecrement}>
        <Icon name="minus" width={14} height={14} />
      </button>
      <span className={clsx('tabular-nums text-center', size === 'sm' ? 'w-4 text-sm' : 'w-5')}>{value}</span>
      <button type="button" className={btn} aria-label="Increase quantity" onClick={onIncrement}>
        <Icon name="plus" width={14} height={14} />
      </button>
    </div>
  )
}
```
```tsx
// PriceTag.tsx
import clsx from 'clsx'
import { formatMoney } from '../store/selectors'

interface Props {
  price: number
  compareAt: number | null
  unit?: 'each' | 'mo'
  align?: 'row' | 'col'
}
export function PriceTag({ price, compareAt, unit = 'each', align = 'row' }: Props) {
  const suffix = unit === 'mo' ? '/mo' : ''
  const active = price === 0 ? 'FREE' : `${formatMoney(price)}${suffix}`
  return (
    <div className={clsx('flex gap-1.5 text-sm', align === 'col' ? 'flex-col items-end' : 'items-center')}>
      {compareAt != null && (
        <span className="text-muted line-through">{formatMoney(compareAt)}{suffix}</span>
      )}
      <span className="font-semibold text-accent">{active}</span>
    </div>
  )
}
```

- [ ] **Step 5: Run test, verify pass.** Run: `npm test -- src/components/QtyStepper.test.tsx` → PASS.

- [ ] **Step 6: Commit**
```bash
git add -A && git commit -m "feat: shared Icon, QtyStepper, PriceTag primitives"
```

---

### Task 5: VariantChips + ProductCard

**Files:**
- Create: `src/components/VariantChips.tsx`, `src/components/ProductCard.tsx`

**Interfaces:**
- Consumes: store actions, `Product`, `QtyStepper`, `PriceTag`, `Icon`.
- Produces: `<VariantChips productId, variants, active, onSelect />` (omitted if single unnamed variant); `<ProductCard product, selection />` — badge?, image, title, description, Learn More?, chips?, stepper or Select button, price. Card is in **selected** state (accent border) when active-variant qty > 0.

- [ ] **Step 1: Implement `VariantChips.tsx`**
```tsx
import clsx from 'clsx'
import type { Variant } from '../types'

interface Props { variants: Variant[]; active: string; onSelect: (id: string) => void }
export function VariantChips({ variants, active, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {variants.map((v) => (
        <button key={v.id} type="button" onClick={() => onSelect(v.id)}
          className={clsx(
            'flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs',
            v.id === active ? 'border-accent text-ink' : 'border-line text-muted',
          )}>
          <span className="h-3 w-3 rounded-full border border-line" style={{ background: v.swatch }} />
          {v.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Implement `ProductCard.tsx`** (data-driven; handles quantity vs single)
```tsx
import clsx from 'clsx'
import { type Product, type SelectionMode, vkey } from '../types'
import { useBundleStore } from '../store/useBundleStore'
import { minQty } from '../store/useBundleStore'
import { VariantChips } from './VariantChips'
import { QtyStepper } from './QtyStepper'
import { PriceTag } from './PriceTag'

export function ProductCard({ product, selection, stepId }:
  { product: Product; selection: SelectionMode; stepId: string }) {
  const hasColors = product.variants.length > 1 || product.variants[0].label !== ''
  const active = useBundleStore((s) => s.activeVariant[product.id]) ?? product.variants[0].id
  const variant = product.variants.find((v) => v.id === active) ?? product.variants[0]
  const qty = useBundleStore((s) => s.qty[vkey(product.id, variant.id)] ?? 0)
  const { increment, decrement, selectVariant, selectSingle } = useBundleStore.getState()
  const selected = qty > 0

  return (
    <article className={clsx(
      'relative flex flex-col gap-3 rounded-[var(--radius-card)] border bg-white p-4',
      selected ? 'border-accent ring-1 ring-accent' : 'border-line',
    )}>
      {product.badge && (
        <span className="absolute left-3 top-3 rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">
          {product.badge}
        </span>
      )}
      <img src={product.image} alt={product.name} className="mx-auto h-28 w-auto object-contain" />
      <div className="space-y-1">
        <h3 className="font-semibold text-ink">{product.name}</h3>
        {product.description && <p className="text-sm text-muted">{product.description}{' '}
          {product.learnMoreUrl && <a href={product.learnMoreUrl} className="font-medium text-accent underline">Learn More</a>}</p>}
      </div>
      {hasColors && (
        <VariantChips variants={product.variants} active={active} onSelect={(id) => selectVariant(product.id, id)} />
      )}
      <div className="mt-auto flex items-center justify-between pt-1">
        {selection === 'single' ? (
          <button type="button" onClick={() => selectSingle(stepId, product.id)}
            className={clsx('rounded-md border px-3 py-1 text-sm font-medium',
              selected ? 'border-accent bg-accent text-white' : 'border-accent text-accent')}>
            {selected ? 'Selected' : 'Select'}
          </button>
        ) : (
          <QtyStepper value={qty}
            minusDisabled={qty <= minQty(product.id)}
            onIncrement={() => increment(product.id, variant.id)}
            onDecrement={() => decrement(product.id, variant.id)} />
        )}
        <PriceTag price={variant.price} compareAt={variant.compareAt} unit={product.priceUnit} />
      </div>
    </article>
  )
}
```

- [ ] **Step 3: Verify visually (deferred to Task 8 render).** No standalone test — covered by integration once mounted. Run `npm run build` to typecheck. Run: `tsc -b` → no errors.

- [ ] **Step 4: Commit**
```bash
git add -A && git commit -m "feat: ProductCard + VariantChips (data-driven, selected state)"
```

---

### Task 6: AccordionStep + BuilderColumn

**Files:**
- Create: `src/components/AccordionStep.tsx`, `src/components/BuilderColumn.tsx`

**Interfaces:**
- Consumes: store (`openStepId`, `openStep`), `useSelectedCount`, `ProductCard`, `Icon`, catalog steps.
- Produces: `<BuilderColumn />` rendering 4 `<AccordionStep step index />`. Header shows "STEP n OF 4", icon, title, "N selected" + chevron. Open step shows product grid + a "Next: …" button that opens the next step.

- [ ] **Step 1: Implement `AccordionStep.tsx`**
```tsx
import clsx from 'clsx'
import { type Step } from '../types'
import catalogJson from '../data/catalog.json'
import { type Catalog } from '../types'
import { useBundleStore } from '../store/useBundleStore'
import { useSelectedCount } from '../store/selectors'
import { ProductCard } from './ProductCard'
import { Icon } from './Icon'

const catalog = catalogJson as Catalog

export function AccordionStep({ step, index }: { step: Step; index: number }) {
  const openStepId = useBundleStore((s) => s.openStepId)
  const open = openStepId === step.id
  const count = useSelectedCount(step.id)
  const nextStep = catalog.steps[index + 1]

  return (
    <section className={clsx('border-b border-line', open && 'bg-panel')}>
      <button type="button" onClick={() => useBundleStore.getState().openStep(step.id)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left">
        <span className="absolute -mt-9 text-[11px] font-medium uppercase tracking-wide text-muted">
          Step {index + 1} of 4
        </span>
        <Icon name={step.icon} className="text-ink" />
        <h2 className="flex-1 text-lg font-semibold text-ink">{step.title}</h2>
        <span className="text-sm font-medium text-accent">{count} selected</span>
        <Icon name="chevron" className={clsx('text-accent transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {step.productIds.map((pid) => (
              <ProductCard key={pid} product={catalog.products[pid]} selection={step.selection} stepId={step.id} />
            ))}
          </div>
          {nextStep && (
            <div className="mt-4 flex justify-center">
              <button type="button" onClick={() => useBundleStore.getState().openStep(nextStep.id)}
                className="rounded-lg border border-accent px-5 py-2 text-sm font-medium text-accent hover:bg-accent-soft">
                {step.nextLabel ?? `Next: ${nextStep.title}`}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
```
> Note: the "STEP n OF 4" eyebrow placement above the header row is tuned visually during execution (the absolute hack is a starting point; a two-row flex header may read cleaner — match the screenshot).

- [ ] **Step 2: Implement `BuilderColumn.tsx`**
```tsx
import catalogJson from '../data/catalog.json'
import { type Catalog } from '../types'
import { AccordionStep } from './AccordionStep'
const catalog = catalogJson as Catalog

export function BuilderColumn() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      {catalog.steps.map((step, i) => (
        <AccordionStep key={step.id} step={step} index={i} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Typecheck.** Run: `tsc -b` → no errors.

- [ ] **Step 4: Commit**
```bash
git add -A && git commit -m "feat: accordion steps + builder column"
```

---

### Task 7: ReviewPanel + SummaryFooter

**Files:**
- Create: `src/components/ReviewLine.tsx`, `src/components/SummaryFooter.tsx`, `src/components/ReviewPanel.tsx`, `src/components/GuaranteeBadge.tsx`

**Interfaces:**
- Consumes: `useGroupedReview`, `useTotals`, store actions, `summary` config, `QtyStepper`, `PriceTag`, `formatMoney`.
- Produces: `<ReviewPanel />` — title + blurb, grouped lines (category subheading → `ReviewLine`s), then `<SummaryFooter />` (shipping row, guarantee badge, financing pill, total with struck pre-discount, savings callout, Checkout button, "Save my system for later" link).

- [ ] **Step 1: Implement `ReviewLine.tsx`**
```tsx
import { type ReviewLine as Line } from '../store/selectors'
import { useBundleStore, minQty } from '../store/useBundleStore'
import { QtyStepper } from './QtyStepper'
import { PriceTag } from './PriceTag'

export function ReviewLine({ line }: { line: Line }) {
  const { increment, decrement } = useBundleStore.getState()
  return (
    <div className="flex items-center gap-3 py-2">
      <img src={line.image} alt="" className="h-9 w-9 rounded-md object-contain" />
      <span className="flex-1 text-sm text-ink">{line.name}{line.required && ' (Required)'}</span>
      {line.selection === 'quantity' && (
        <QtyStepper size="sm" value={line.qty}
          minusDisabled={line.qty <= minQty(line.productId)}
          onIncrement={() => increment(line.productId, line.variantId)}
          onDecrement={() => decrement(line.productId, line.variantId)} />
      )}
      <PriceTag price={line.lineTotal} compareAt={line.unitCompareAt == null ? null : line.lineCompareAt} unit={line.priceUnit} />
    </div>
  )
}
```

- [ ] **Step 2: Implement `GuaranteeBadge.tsx`** — a scalloped/starburst purple seal SVG with "100% Wyze satisfaction guarantee" text. (Hand-draw an SVG circle with `<text>` on a path or a simple layered badge; tuned to the screenshot.)

- [ ] **Step 3: Implement `SummaryFooter.tsx`**
```tsx
import catalogJson from '../data/catalog.json'
import { type Catalog } from '../types'
import { useTotals, formatMoney } from '../store/selectors'
import { useBundleStore } from '../store/useBundleStore'
import { PriceTag } from './PriceTag'
import { GuaranteeBadge } from './GuaranteeBadge'
import { Icon } from './Icon'

const catalog = catalogJson as Catalog

export function SummaryFooter() {
  const { total, preDiscount, savings } = useTotals()
  const saved = useBundleStore((s) => s.saved)
  const { shipping, financingLabel } = catalog.summary

  return (
    <div className="space-y-4 pt-3">
      <div className="flex items-center gap-3 border-t border-line pt-3">
        <Icon name="truck" className="text-save" />
        <span className="flex-1 text-sm text-ink">{shipping.label}</span>
        <PriceTag price={shipping.price} compareAt={shipping.compareAt} />
      </div>

      <div className="flex items-center gap-3">
        <GuaranteeBadge />
        <div>
          <span className="inline-block rounded bg-accent px-2 py-0.5 text-xs text-white">{financingLabel}</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-muted line-through">{formatMoney(preDiscount)}</span>
            <span className="text-2xl font-bold text-accent">{formatMoney(total)}</span>
          </div>
        </div>
      </div>

      <p className="text-center text-sm font-medium text-save">
        Congrats! You're saving {formatMoney(savings)} on your security bundle!
      </p>

      <button type="button" onClick={() => { useBundleStore.getState().saveForLater(); alert('Checkout — demo only') }}
        className="w-full rounded-xl bg-accent py-3 font-semibold text-white hover:opacity-95">
        Checkout
      </button>
      <button type="button" onClick={() => useBundleStore.getState().saveForLater()}
        className="block w-full text-center text-sm italic text-muted underline">
        {saved ? 'Saved ✓ — Save my system for later' : 'Save my system for later'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Implement `ReviewPanel.tsx`**
```tsx
import { useGroupedReview } from '../store/selectors'
import { ReviewLine } from './ReviewLine'
import { SummaryFooter } from './SummaryFooter'

export function ReviewPanel() {
  const groups = useGroupedReview()
  return (
    <aside className="rounded-2xl bg-panel p-5">
      <h2 className="text-xl font-bold text-ink">Your security system</h2>
      <p className="mt-1 text-sm text-muted">
        Review your personalized protection system designed to keep what matters most safe.
      </p>
      <div className="mt-4 divide-y divide-line">
        {groups.map((g) => (
          <div key={g.category} className="py-3">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{g.category}</h3>
            {g.lines.map((l) => <ReviewLine key={`${l.productId}:${l.variantId}`} line={l} />)}
          </div>
        ))}
      </div>
      <SummaryFooter />
    </aside>
  )
}
```

- [ ] **Step 5: Typecheck.** Run: `tsc -b` → no errors.

- [ ] **Step 6: Commit**
```bash
git add -A && git commit -m "feat: review panel, review lines, summary footer"
```

---

### Task 8: App layout + responsive shell + first visual pass

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `BuilderColumn`, `ReviewPanel`.
- Produces: responsive two-column page; review = sticky sidebar on desktop, stacked below on tablet/mobile.

- [ ] **Step 1: Implement `src/App.tsx`**
```tsx
import { BuilderColumn } from './components/BuilderColumn'
import { ReviewPanel } from './components/ReviewPanel'

export default function App() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Let's get started!</h1>
      </header>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <BuilderColumn />
        <div className="lg:sticky lg:top-6 lg:self-start">
          <ReviewPanel />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run the app and compare to screenshots**
Run: `npm run dev`. Open in browser. Verify against the three screenshots:
  - Step 1 open on load, cameras 2-up, others collapsed with chevrons.
  - Review panel shows seeded lines, total **$187.89**, struck **$238.81**, "saving **$50.92**".
  - Resize: <640px single column; ≥1024px sticky sidebar.

- [ ] **Step 3: Tune spacing/typography/colors** to match the screenshots (badge style, chip look, accordion eyebrow placement, panel padding, total typography). Iterate in the component files until it reads like the design.

- [ ] **Step 4: Commit**
```bash
git add -A && git commit -m "feat: responsive app layout, first visual pass"
```

---

### Task 9: Product SVG assets

**Files:**
- Create: `public/products/*.svg` (one per product id used above)

**Interfaces:**
- Produces: recognizable, hand-crafted SVG illustrations resembling each device (cube cam, pan cam with round head, floodlight, doorbell, battery cam, motion sensor, hub, sensors, microSD cards, solar panel, plan badges). No external/copyright assets.

- [ ] **Step 1: Create each SVG** at `public/products/<id>.svg` matching the `image` paths in `catalog.json`. Keep them simple, on-brand (white bodies, dark lenses), ~120×120 viewBox.
- [ ] **Step 2: Verify** every `image` path in the catalog resolves (no broken images in the running app).
- [ ] **Step 3: Commit**
```bash
git add -A && git commit -m "feat: recreated product SVG illustrations"
```

---

### Task 10: Persistence verification + README + final checks

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces: clean-clone run instructions + decisions/tradeoffs; green lint/test/build.

- [ ] **Step 1: Manually verify persistence** — change quantities, click "Save my system for later", reload the page → state restored exactly (localStorage `wyze-bundle-v1`). Also verify auto-restore without clicking save.
- [ ] **Step 2: Add a persistence/integration test** `src/store/persistence.test.ts` asserting `partialize` output contains `qty`, `activeVariant`, `openStepId` and round-trips through `useBundleStore.persist.rehydrate()`. (If jsdom localStorage needs a shim, use the provided `vitest` jsdom env.)
- [ ] **Step 3: Rewrite `README.md`** — project intro, `npm install` / `npm run dev` / `npm test` / `npm run build`, architecture summary, and **Decisions/Tradeoffs** section: screenshot-only fidelity (no Figma), recreated SVG imagery, the Pan v3 card-vs-review source inconsistency (totals match the design exactly), single-select plan, what's out of scope (backend bonus skipped).
- [ ] **Step 4: Run full gate.** Run: `npm run lint && npm test && npm run build` → all green.
- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "docs: README with run instructions and decisions; final checks"
```

---

### Task 11: Publish to public GitHub repo (confirm with user first)

- [ ] **Step 1:** Confirm with the user before creating/pushing a public repo (outward-facing action).
- [ ] **Step 2:** `gh repo create` (public) + push `main`.
- [ ] **Step 3:** Verify the repo builds from a clean clone (`git clone … && npm install && npm run dev`).

---

## Self-Review

**Spec coverage:** layout/responsive → T8; data model/catalog → T1; state Approach A → T2; derivations (review, N-selected, totals, plan-included) → T3; variant-qty behavior → T2/T5; components → T4–T7; persistence → T2(persist)+T10; visual system/imagery → T8/T9; tests → T2/T3/T4/T10; deliverables/README → T10/T11. All covered.

**Placeholder scan:** No "TBD/TODO/handle edge cases". The two "tuned to screenshot" notes (eyebrow placement, guarantee badge SVG, exact spacing) are genuine visual-iteration steps with concrete starting code, not logic placeholders — acceptable for fidelity work that must be eyeballed against the design.

**Type consistency:** `vkey`, `ReviewLine`, `Totals`, store action names (`setQty/increment/decrement/selectVariant/selectSingle/openStep/saveForLater/reset`), `minQty`, and selector hook names are used identically across tasks. `unitCompareAt` (nullable, drives whether a struck price shows) vs `lineCompareAt` (numeric, used for totals) are consistent in T3/T7.
