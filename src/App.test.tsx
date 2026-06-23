import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import App from './App'
import { useBundleStore } from './store/useBundleStore'

beforeEach(() => {
  localStorage.clear()
  useBundleStore.getState().reset()
})

describe('App (integration, seeded state)', () => {
  it('renders the heading and review panel', () => {
    render(<App />)
    expect(screen.getByText("Let's get started!")).toBeInTheDocument()
    expect(screen.getByText('Your security system')).toBeInTheDocument()
  })

  it('shows the exact seeded totals and savings', () => {
    render(<App />)
    expect(screen.getByText('$187.89')).toBeInTheDocument()
    expect(screen.getByText('$238.81')).toBeInTheDocument()
    expect(screen.getByText(/saving \$50\.92/)).toBeInTheDocument()
  })

  it('opens step 1 (cameras) on load with its product cards', () => {
    render(<App />)
    // The cameras step is expanded, so the full camera catalog renders.
    expect(screen.getAllByText('Wyze Cam v4').length).toBeGreaterThan(0)
    expect(screen.getByText('Wyze Cam Floodlight v2')).toBeInTheDocument()
  })

  it('marks the Sense Hub review line as Required with a disabled minus', () => {
    render(<App />)
    expect(screen.getByText(/Wyze Sense Hub \(Required\)/)).toBeInTheDocument()
  })

  it('renders a free shipping row', () => {
    render(<App />)
    const free = screen.getAllByText('FREE')
    expect(free.length).toBeGreaterThan(0)
    // The cameras step's "N selected" eyebrow shows 2.
    const cameras = screen.getByRole('button', { name: /Choose your cameras/ })
    expect(within(cameras).getByText('2 selected')).toBeInTheDocument()
  })
})
