import clsx from 'clsx'
import { type Product, type SelectionMode, vkey } from '../types'
import { useBundleStore, minQty } from '../store/useBundleStore'
import { VariantChips } from './VariantChips'
import { QtyStepper } from './QtyStepper'
import { PriceTag } from './PriceTag'

interface Props {
  product: Product
  selection: SelectionMode
  stepId: string
}

export function ProductCard({ product, selection, stepId }: Props) {
  const hasColors = product.variants.length > 1 || product.variants[0].label !== ''
  const active = useBundleStore((s) => s.activeVariant[product.id]) ?? product.variants[0].id
  const variant = product.variants.find((v) => v.id === active) ?? product.variants[0]
  const qty = useBundleStore((s) => s.qty[vkey(product.id, variant.id)] ?? 0)
  const selected = qty > 0

  const { increment, decrement, selectVariant, selectSingle } = useBundleStore.getState()

  return (
    <article
      className={clsx(
        'relative flex gap-4 rounded-card border-2 bg-white p-4 transition',
        selected ? 'border-accent' : 'border-line',
      )}
    >
      {product.badge && (
        <span className="absolute left-3 top-3 z-10 rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">
          {product.badge}
        </span>
      )}

      <img
        src={product.image}
        alt={product.name}
        className="h-28 w-24 shrink-0 self-center object-contain"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="space-y-1">
          <h3 className="font-semibold leading-tight text-ink">{product.name}</h3>
          {product.description && (
            <p className="text-sm leading-snug text-muted">
              {product.description}{' '}
              {product.learnMoreUrl && (
                <a href={product.learnMoreUrl} className="font-medium text-accent underline">
                  Learn More
                </a>
              )}
            </p>
          )}
        </div>

        {hasColors && (
          <VariantChips
            variants={product.variants}
            active={active}
            onSelect={(id) => selectVariant(product.id, id)}
          />
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {selection === 'single' ? (
            <button
              type="button"
              onClick={() => selectSingle(stepId, product.id)}
              className={clsx(
                'rounded-md border px-3 py-1 text-sm font-medium transition',
                selected
                  ? 'border-accent bg-accent text-white'
                  : 'border-accent text-accent hover:bg-accent-soft',
              )}
            >
              {selected ? 'Selected' : 'Select'}
            </button>
          ) : (
            <QtyStepper
              value={qty}
              minusDisabled={qty <= minQty(product.id)}
              onIncrement={() => increment(product.id, variant.id)}
              onDecrement={() => decrement(product.id, variant.id)}
            />
          )}
          <PriceTag price={variant.price} compareAt={variant.compareAt} unit={product.priceUnit} />
        </div>
      </div>
    </article>
  )
}
