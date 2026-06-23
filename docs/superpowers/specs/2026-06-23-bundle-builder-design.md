# Bundle Builder — Design Spec

**Date:** 2026-06-23
**Status:** Approved direction; pending written-spec review

## 1. Summary

A two-column React prototype: a **4-step accordion "bundle builder"** on the left and a
**live "Your security system" review panel** on the right. The shopper assembles a security
system (cameras, plan, sensors, extra protection); the review panel reflects every selection
in real time, recalculates the total as quantities change, and the configuration can be saved
to and restored from the browser.

Rebuilt from three provided screenshots (mobile + two desktop framings). No live Figma
connection was available, so exact hex/spacing/prices are best-estimates from the images.

## 2. Tech & tooling (fixed by existing scaffold)

- **Vite + React 19 + TypeScript**
- **Zustand** for state (with `persist` middleware for localStorage)
- **Tailwind CSS v4** via `@tailwindcss/vite` — *must be wired into `vite.config.ts`* (currently absent)
- **clsx** for conditional class composition
- **oxlint** for linting
- **Vitest** added for unit tests (store logic)
- Repo will be `git init`-ed and published to a public GitHub repo with README + run instructions.

## 3. Layout & responsive strategy

The three screenshots are treated as breakpoints, not competing designs:

| Tier | Width | Layout |
|---|---|---|
| **Desktop** (canonical) | ≥ 1024px | Builder accordion left; review panel as **sticky right sidebar** (~360px). Camera cards wrap **2-up**. |
| **Tablet** | 640–1024px | Accordion full-width on top; review panel stacked **below**. Cards 2–3 up by width. |
| **Mobile** | < 640px | Single column; accordion (1 card/row) then review panel below. |

Implementation: a CSS grid that collapses columns at breakpoints + `position: sticky` on the
sidebar. The layout must stay usable and visually coherent at every width down to a phone.

## 4. Data model — `src/data/catalog.json`

One JSON file drives all rendering. Nothing per-product is hardcoded in markup.

```jsonc
{
  "steps": [
    {
      "id": "cameras",
      "title": "Choose your cameras",
      "icon": "camera",            // maps to an icon component/sprite id
      "reviewCategory": "Cameras", // grouping header in the review panel
      "selection": "quantity",     // "quantity" (steppers) | "single" (radio, no stepper)
      "productIds": ["wyze-cam-v4", "wyze-cam-pan-v3", "wyze-cam-floodlight-v2", "wyze-duo-cam-doorbell", "wyze-battery-cam-pro"]
    },
    { "id": "plan", "title": "Choose your plan", "icon": "shield", "reviewCategory": "Plan", "selection": "single", "productIds": [ ... ] },
    { "id": "sensors", "title": "Choose your sensors", "icon": "sensor", "reviewCategory": "Sensors", "selection": "quantity", "productIds": [ ... ] },
    { "id": "extra", "title": "Add extra protection", "icon": "grid", "reviewCategory": "Accessories", "selection": "quantity", "productIds": [ ... ] }
  ],
  "products": {
    "wyze-cam-v4": {
      "name": "Wyze Cam v4",
      "badge": "Save 22%",                                  // optional
      "description": "The clearest Wyze Cam ever made.",
      "learnMoreUrl": "#",                                  // optional
      "image": "/products/cam-v4.svg",
      "priceUnit": "each",                                  // "each" | "mo" (plan)
      "variants": [
        { "id": "white", "label": "White", "swatch": "#ffffff", "price": 27.98, "compareAt": 35.98 },
        { "id": "grey",  "label": "Grey",  "swatch": "#9aa0a6", "price": 27.98, "compareAt": 35.98 },
        { "id": "black", "label": "Black", "swatch": "#111111", "price": 27.98, "compareAt": 35.98 }
      ]
    }
    // Products with NO color options omit the chip row and use a single implicit
    // "default" variant (e.g. the doorbell), so quantity code has one code path.
  }
}
```

### Catalog read from the screenshots

**Cameras (step 1 — full catalog visible):**
| Product | Badge | Variants | Notes |
|---|---|---|---|
| Wyze Cam v4 | Save 22% | White, Grey, Black | seeded qty 1 |
| Wyze Cam Pan v3 | Save 12% | White, Black | seeded qty 2 |
| Wyze Cam Floodlight v2 | Save 22% | White, Black | qty 0 |
| Wyze Duo Cam Doorbell | — | none | qty 0, no compare-at |
| Wyze Battery Cam Pro | — | White, Black | qty 0 |

**Steps 2–4** appear only as pre-seeded review lines in the design (no card catalog shown), so
their card catalogs are authored as plausible products. Seeded items that must appear in the
review on load:
- **Plan → Cam Unlimited** — $9.99/mo (compare $12.99/mo)
- **Sensors → Wyze Sense Motion Sensor** (qty 2) and **Wyze Sense Hub (Required)** (qty 1, FREE, compare $29.92; stepper minus disabled — required item)
- **Accessories → Wyze MicroSD Card (256GB)** (qty 2)

### Pricing rule (single source of truth)

Each variant carries `price` (active unit) and `compareAt` (struck unit). The card shows **unit**
prices; the review line shows **unit × qty** with `compareAt × qty` struck. The screenshots'
card vs. review numbers don't reconcile to the cent (placeholder mock values + lossy images);
authoring price once per variant keeps everything internally consistent and makes the total
**recalculate correctly**, which is the graded behavior. Seed prices are tuned to land **near**
the design's total ($187.89 / save $50.92); residual drift is noted in the README (we are not
back-solving to the exact penny).

Special pricing: an item priced **FREE** has `price: 0` with a non-zero `compareAt` (Sense Hub,
Fast Shipping) and renders the word "FREE" in accent color.

Non-product summary rows (shipping, guarantee, financing) live in a small `summary` block in the
JSON (e.g. `shipping: { label, compareAt, price }`, `guarantee` text, `financingApr`).

## 5. State model — Approach A (flat keyed map)

The catalog is static. The store holds **only** user-mutable state:

```ts
type VariantKey = `${string}:${string}`; // `${productId}:${variantId}`

interface BuilderState {
  qty: Record<VariantKey, number>;        // counts per product+variant
  activeVariant: Record<string, string>;  // productId -> currently selected variantId
  openStepId: string | null;              // which accordion step is expanded
  // actions
  setQty(productId, variantId, n): void;
  increment(productId, variantId): void;
  decrement(productId, variantId): void;  // clamped at 0
  selectVariant(productId, variantId): void;
  openStep(stepId): void;                 // accordion (single-open)
  saveForLater(): void;                   // flush + confirmation
}
```

**Everything else is a derived selector** (review lines, per-step "N selected", per-line totals,
grand total, savings, financing) — they cannot drift from the source of truth.

### Key derivations
- **Review lines:** for each step (in order), each product's variants with `qty > 0` → one line,
  grouped under `reviewCategory`. `{ productId, variantId, name, image, unitPrice, unitCompareAt, qty, lineTotal }`.
- **"N selected" per step:** count of **distinct products** in that step with total qty > 0
  (a product with two colors both > 0 still counts once). For a `single`-selection step it is
  0 or 1. Matches the design's 2/1/2/1.
- **Grand total:** `Σ lineTotal` over product lines **+ shipping.price** (+ plan is a monthly line,
  shown separately as `/mo`, excluded from the one-time hardware total — matches the design where
  the plan shows `$9.99/mo` and is not summed into $187.89). Final exact composition tuned to land near design.
- **Savings:** `Σ(compareAt − price)×qty` (+ shipping savings) → the "$50.92" callout.
- **Pre-discount total** (struck): `Σ compareAt×qty + shipping.compareAt`.

### The variant-quantity behavior (core requirement)
- `setQty/increment/decrement` are keyed by `productId:variantId`, so Red and Blue track separately.
- The card's stepper binds to `activeVariant[productId]` — selecting a color makes it active and
  the stepper reads/edits **that** variant's count (add 2 Red, switch to Blue → stepper shows 0,
  Red×2 untouched).
- The review panel renders **every** variant with qty > 0 as its own line, so switching the card
  to Blue does not remove Red×2 from the summary.
- Card and review steppers for the same variant are the same store entry → always in sync.

## 6. Component architecture

```
App
├─ BuilderColumn
│   └─ AccordionStep (×4)            // header: "STEP n OF 4", icon, title, "N selected" + chevron
│       ├─ ProductCard (×N)          // badge?, image, title, desc, Learn More?, chips?, stepper, price
│       │   ├─ VariantChips          // swatch + label row (omitted if no variants)
│       │   ├─ QtyStepper  (shared)
│       │   └─ PriceTag    (shared)  // struck compareAt + active price (or FREE)
│       └─ NextButton                // "Next: <next step title>" → opens next step
└─ ReviewPanel
    ├─ ReviewGroup (Cameras/Plan/Sensors/Accessories)
    │   └─ ReviewLine (×N)           // thumb, name, QtyStepper, PriceTag
    └─ SummaryFooter                 // shipping row, guarantee seal, financing pill,
                                     // total (struck pre-discount + active), savings callout,
                                     // Checkout button, "Save my system for later" link
```

`QtyStepper` and `PriceTag` are shared between card and review. All rendering is data-driven;
adding a product = editing JSON only.

**Single-selection (plan) step:** for a step with `selection: "single"`, the cards behave as
radio options (selecting one sets its qty to 1 and zeroes the other plan products), and the
matching review line renders **price only — no `QtyStepper`** (a subscription isn't a quantity).
The card may use a "Selected"/"Select" affordance instead of a stepper. All other steps use
`QtyStepper` on both card and review line.

## 7. Visual system (estimated from screenshots; refined in implementation)

- **Accent** indigo/purple (`~#4B36CD`): badges, "N selected", Learn More, active prices/FREE,
  Checkout, financing pill, guarantee seal, selected-card border.
- **Panel bg**: very light lavender-blue (`~#F4F6FF`) for the review panel and expanded step area.
- **Savings text**: green.
- **Greys**: struck compare prices, "STEP n OF 4" label, body descriptions, borders.
- **Badge**: filled indigo pill, white text, top-left of card.
- **Color chip**: bordered rounded rect with swatch dot + label (active-chip highlight is
  explicitly out of scope per the brief — selection behavior matters, not chip styling).
- **QtyStepper**: `[−] n [+]`, bordered rounded; **minus disabled at 0** and for the required Hub.
- **Chevron**: open step = up-chevron + "N selected"; collapsed = down-chevron.
- **NextButton**: outlined indigo. **Checkout**: solid indigo full-width.
- Icons: small inline SVGs/sprite (camera, shield, sensor, grid, truck) — recreated, not from Figma.
- **Product imagery**: recreated as hand-crafted local SVGs resembling each device (no real
  assets available, no external/copyright dependency), referenced by the JSON `image` field.

## 8. Persistence ("Save my system for later")

Zustand `persist` middleware mirrors `{ qty, activeVariant, openStepId }` to **localStorage**
under a versioned key. State auto-restores on reload/return. The "Save my system for later" link
explicitly flushes and shows a brief confirmation (the auto-persist already covers correctness;
the link makes the save intent visible). Checkout = simple confirmation (placeholder).

## 9. Testing (Vitest)

Unit tests on store logic — the riskiest, most behavior-defining code:
- variant-quantity isolation (Red vs Blue independent; active-variant binding shows 0 for Blue)
- decrement clamps at 0; required-item minus disabled
- grand total / savings / pre-discount recalculation as quantities change
- "N selected" counts distinct products (not variant lines)

## 10. Deliverables

- Public GitHub repo: React source, `catalog.json`, recreated SVG assets, tests.
- README: clean-clone run instructions (`npm install` / `npm run dev`), decisions, tradeoffs,
  and explicitly: screenshot-derived tokens, recreated imagery, total tuned near (not exactly) the design.

## 11. Known limitations / tradeoffs

- No Figma connection → exact hex/spacing/price are screenshot estimates.
- Product images are recreated SVGs, not real assets.
- Grand total lands near $187.89, not back-solved to the exact penny.
- Backend (JSON-serving) bonus skipped — local JSON file per the brief.

## 12. Out of scope (YAGNI)

- Real checkout/payment, accounts, server persistence, i18n, a11y audit beyond sensible defaults,
  active-chip highlight styling (explicitly deferred by the brief).
