import '@testing-library/jest-dom/vitest'
import db from '../../server/db.json'
import type { Catalog } from '../types'
import { setCatalog } from '../data/catalog'

// The app fetches the catalog at runtime; tests inject it synchronously so the
// store/selectors (which read it via getCatalog) have data when their modules load.
setCatalog((db as { catalog: Catalog }).catalog)
