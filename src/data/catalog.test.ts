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
    for (const p of Object.values(catalog.products))
      expect(p.variants.length).toBeGreaterThan(0)
  })

  it('every seed item resolves to a real product+variant', () => {
    for (const s of catalog.seed) {
      const p = catalog.products[s.productId]
      expect(p).toBeDefined()
      expect(p.variants.find((v) => v.id === s.variantId)).toBeDefined()
    }
  })
})
