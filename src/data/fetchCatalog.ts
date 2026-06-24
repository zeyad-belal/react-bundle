import type { Catalog } from '../types'

/**
 * Loads the catalog from the JSON server. In dev, Vite proxies `/api` →
 * the json-server instance (see vite.config.ts), which serves the catalog
 * at `/catalog`. Override the base with VITE_API_URL if needed.
 */
export async function fetchCatalog(): Promise<Catalog> {
  const base = import.meta.env.VITE_API_URL ?? '/api'
  const res = await fetch(`${base}/catalog`)
  if (!res.ok) {
    throw new Error(`Failed to load catalog (${res.status} ${res.statusText})`)
  }
  return (await res.json()) as Catalog
}
