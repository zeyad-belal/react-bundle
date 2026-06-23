import { BuilderColumn } from './components/BuilderColumn'
import { ReviewPanel } from './components/ReviewPanel'

export default function App() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Let&apos;s get started!
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <BuilderColumn />
        <div className="lg:sticky lg:top-6 lg:self-start">
          <ReviewPanel />
        </div>
      </div>
    </div>
  )
}
