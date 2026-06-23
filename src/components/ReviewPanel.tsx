import { useGroupedReview } from '../store/selectors'
import { ReviewLine } from './ReviewLine'
import { SummaryFooter } from './SummaryFooter'

export function ReviewPanel() {
  const groups = useGroupedReview()

  return (
    <aside className="rounded-2xl bg-panel p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Review</p>
      <h2 className="mt-1 text-xl font-bold text-ink">Your security system</h2>
      <p className="mt-1 text-sm text-muted">
        Review your personalized protection system designed to keep what matters most safe.
      </p>

      <div className="mt-4 divide-y divide-line border-t border-line">
        {groups.map((g) => (
          <div key={g.category} className="py-3">
            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              {g.category}
            </h3>
            {g.lines.map((l) => (
              <ReviewLine key={`${l.productId}:${l.variantId}`} line={l} />
            ))}
          </div>
        ))}
      </div>

      <SummaryFooter />
    </aside>
  )
}
