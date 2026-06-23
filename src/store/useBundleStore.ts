import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import catalogJson from '../data/catalog.json'
import { type Catalog, vkey } from '../types'

const catalog = catalogJson as Catalog

/** Minimum allowed quantity for a product. Required items (Sense Hub) can't go below 1. */
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
  // A seeded variant should be the active chip on load (e.g. White cam pre-selected).
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

      // setQty is the single gate for quantity changes: it clamps to the product's
      // minimum (0 normally, 1 for required items) so the rule lives in one place.
      // increment/decrement read the current count and route through setQty.
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
