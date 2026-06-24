import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import db from '../server/db.json'
import type { Catalog } from './types'

vi.mock('./data/fetchCatalog', () => ({ fetchCatalog: vi.fn() }))
import { fetchCatalog } from './data/fetchCatalog'
import { Boot } from './Boot'

const catalog = (db as { catalog: Catalog }).catalog

beforeEach(() => {
  localStorage.clear()
  vi.mocked(fetchCatalog).mockReset()
})

describe('Boot (catalog fetch)', () => {
  it('shows loading, then renders the app once the catalog loads', async () => {
    vi.mocked(fetchCatalog).mockResolvedValue(catalog)
    render(<Boot />)
    expect(screen.getByText(/Loading your system/)).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText('Your security system')).toBeInTheDocument(),
    )
  })

  it('shows an error state when the catalog fetch fails', async () => {
    vi.mocked(fetchCatalog).mockRejectedValue(new Error('network down'))
    render(<Boot />)
    await waitFor(() =>
      expect(screen.getByText(/Couldn't reach the catalog API/)).toBeInTheDocument(),
    )
  })
})
