import { type ReviewLine as Line } from '../store/selectors'
import { useBundleStore, minQty } from '../store/useBundleStore'
import { QtyStepper } from './QtyStepper'
import { PriceTag } from './PriceTag'

export function ReviewLine({ line }: { line: Line }) {
  const { increment, decrement } = useBundleStore.getState()

  return (
    <div className="flex items-center gap-3 py-2">
      <img
        src={line.image}
        alt=""
        className="h-9 w-9 shrink-0 rounded-md border border-line bg-white object-contain p-0.5"
      />
      <span className="min-w-0 flex-1 truncate text-sm text-ink">
        {line.name}
        {line.required && ' (Required)'}
      </span>

      {line.selection === 'quantity' && (
        <QtyStepper
          size="sm"
          value={line.qty}
          minusDisabled={line.qty <= minQty(line.productId)}
          onIncrement={() => increment(line.productId, line.variantId)}
          onDecrement={() => decrement(line.productId, line.variantId)}
        />
      )}

      <PriceTag
        price={line.lineTotal}
        compareAt={line.unitCompareAt == null ? null : line.lineCompareAt}
        unit={line.priceUnit}
        align="col"
      />
    </div>
  )
}
