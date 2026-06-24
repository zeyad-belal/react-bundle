import type { Catalog } from '../types'

/**
 * Runtime catalog holder. The data is fetched from the JSON server at boot
 * (see fetchCatalog + main.tsx) and injected here once, before the store and
 * selectors — which read it via getCatalog() — are evaluated. Tests set it
 * directly in the Vitest setup file.
 */
let catalog: Catalog | null = null

export function setCatalog(next: Catalog): void {
  catalog = next
}

export function getCatalog(): Catalog {
  if (!catalog) {
    throw new Error('Catalog not loaded — call setCatalog() before using the store/selectors.')
  }
  return catalog
}
