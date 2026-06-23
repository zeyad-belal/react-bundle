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

/** One line per product+variant with qty > 0, in catalog/step order. */
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

/** Number of distinct products in a step with total qty > 0 (variants collapse to one). */
export function selectedCount(qty: Record<string, number>, stepId: string): number {
  const step = catalog.steps.find((s) => s.id === stepId)
  if (!step) return 0
  let count = 0
  for (const pid of step.productIds) {
    const total = catalog.products[pid].variants.reduce(
      (sum, v) => sum + (qty[vkey(pid, v.id)] ?? 0),
      0,
    )
    if (total > 0) count++
  }
  return count
}

export interface Totals {
  total: number
  preDiscount: number
  savings: number
}

/** Active total + struck pre-discount total + savings, summed over all review lines. */
export function totals(qty: Record<string, number>): Totals {
  const lines = reviewLines(qty)
  const total = round2(lines.reduce((s, l) => s + l.lineTotal, 0))
  const preDiscount = round2(lines.reduce((s, l) => s + l.lineCompareAt, 0))
  return { total, preDiscount, savings: round2(preDiscount - total) }
}

export function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

// ── React hooks (recompute per render; cheap at this scale) ──────────────────
export const useReviewLines = () => reviewLines(useBundleStore((s) => s.qty))
export const useSelectedCount = (stepId: string) =>
  selectedCount(useBundleStore((s) => s.qty), stepId)
export const useTotals = () => totals(useBundleStore((s) => s.qty))

export interface ReviewGroup {
  category: string
  lines: ReviewLine[]
}

/** Review lines bucketed by category, preserving first-seen order. */
export function useGroupedReview(): ReviewGroup[] {
  const lines = useReviewLines()
  const order: string[] = []
  const map = new Map<string, ReviewLine[]>()
  for (const l of lines) {
    if (!map.has(l.category)) {
      map.set(l.category, [])
      order.push(l.category)
    }
    map.get(l.category)!.push(l)
  }
  return order.map((category) => ({ category, lines: map.get(category)! }))
}
