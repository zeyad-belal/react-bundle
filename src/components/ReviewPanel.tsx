import { useGroupedReview } from '../store/selectors'
import { ReviewLine } from './ReviewLine'
import { SummaryFooter } from './SummaryFooter'

export function ReviewPanel() {
  const groups = useGroupedReview()

  return (
    <aside className="rounded-[10px] bg-panel px-5 pb-8 pt-4">
      <p className="text-center text-xs font-medium uppercase tracking-[0.16em] text-faint">
        Review
      </p>
      <h2 className="mt-2 text-[22px] font-semibold text-heading">Your security system</h2>
      <p className="mt-1 text-sm leading-snug text-muted">
        Review your personalized protection system designed to keep what matters most safe.
      </p>

      <div className="mt-3 flex flex-col gap-2.5">
        {groups.map((g) => (
          <div key={g.category} className="flex flex-col gap-2 border-t border-divider pt-4">
            <h3 className="text-xs font-normal uppercase tracking-[0.04em] text-label">
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
