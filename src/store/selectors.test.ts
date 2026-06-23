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
