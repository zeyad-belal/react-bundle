import { describe, it, expect, beforeEach } from 'vitest'
import { useBundleStore } from './useBundleStore'

beforeEach(() => {
  localStorage.clear()
  useBundleStore.getState().reset()
})

describe('persistence (localStorage)', () => {
  it('writes qty / activeVariant / openStepId under the versioned key', () => {
    useBundleStore.getState().increment('wyze-cam-v4', 'white') // 1 -> 2
    useBundleStore.getState().openStep('plan')

    const raw = localStorage.getItem('wyze-bundle-v1')
    expect(raw).toBeTruthy()

    const parsed = JSON.parse(raw!)
    expect(parsed.state.qty['wyze-cam-v4:white']).toBe(2)
    expect(parsed.state.activeVariant).toBeDefined()
    expect(parsed.state.openStepId).toBe('plan')
  })

  it('does not persist the transient `saved` flag', () => {
    useBundleStore.getState().saveForLater()
    const parsed = JSON.parse(localStorage.getItem('wyze-bundle-v1')!)
    expect('saved' in parsed.state).toBe(false)
  })
})
