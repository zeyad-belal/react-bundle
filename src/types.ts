export interface Variant {
  id: string
  label: string
  swatch: string // hex for the chip dot
  price: number // active unit price
  compareAt: number | null // struck unit price; null = no discount
}

export interface Product {
  id: string
  name: string
  badge?: string // e.g. "Save 22%"
  description?: string
  learnMoreUrl?: string
  image: string // /products/<id>.svg
  priceUnit: 'each' | 'mo'
  required?: boolean // true => min qty 1, minus disabled
  variants: Variant[] // always >= 1 (no-color products get one 'default')
}

export type SelectionMode = 'quantity' | 'single'

export interface Step {
  id: string
  title: string
  icon: string // icon key
  reviewCategory: string // grouping header in review panel
  selection: SelectionMode
  nextLabel?: string // text for the "Next: …" button
  productIds: string[]
}

export interface SummaryConfig {
  shipping: { label: string; price: number; compareAt: number }
  guarantee: { percent: string; title: string; blurb: string }
  financingLabel: string // "as low as $19.19/mo"
}

export interface SeedItem {
  productId: string
  variantId: string
  qty: number
}

export interface Catalog {
  steps: Step[]
  products: Record<string, Product>
  summary: SummaryConfig
  seed: SeedItem[]
}

export const vkey = (productId: string, variantId: string) => `${productId}:${variantId}`
