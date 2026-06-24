import { Suspense, lazy, useEffect, useState, type ReactNode } from 'react'
import { fetchCatalog } from './data/fetchCatalog'
import { setCatalog } from './data/catalog'

// Lazy so the store/selectors (which read the catalog) only evaluate AFTER it's loaded.
const App = lazy(() => import('./App'))

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center text-muted">
      {children}
    </div>
  )
}

/** Fetches the catalog from the JSON server, then renders the app. */
export function Boot() {
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')

  useEffect(() => {
    fetchCatalog()
      .then((catalog) => {
        setCatalog(catalog)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  if (status === 'loading') return <Centered>Loading your system…</Centered>
  if (status === 'error')
    return (
      <Centered>
        <div className="space-y-2">
          <p className="font-semibold text-ink">Couldn&apos;t reach the catalog API.</p>
          <p className="text-sm">
            Start everything with{' '}
            <code className="rounded bg-panel px-1.5 py-0.5">npm run dev</code> (it runs the app and
            the JSON server together).
          </p>
        </div>
      </Centered>
    )

  return (
    <Suspense fallback={<Centered>Loading your system…</Centered>}>
      <App />
    </Suspense>
  )
}
