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
