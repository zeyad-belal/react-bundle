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
        'relative flex items-center gap-[19px] rounded-[10px] border-2 bg-white p-[11px] transition',
        selected ? 'border-accent/70' : 'border-line',
      )}
    >
      <div className="relative h-[137px] w-[101px] shrink-0 self-stretch overflow-hidden rounded-[5px]">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain"
        />
        {product.badge && (
          <span className="absolute left-0 top-0 rounded-[10px] bg-accent px-1.5 py-0.5 text-[12px] font-semibold text-white">
            {product.badge}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex flex-col gap-2">
          <h3 className="text-[16px] font-semibold leading-none text-heading">{product.name}</h3>
          {product.description && (
            <p className="text-[12px] leading-[1.3] text-[rgba(31,31,31,0.75)]">
              {product.description}{' '}
              {product.learnMoreUrl && (
                <a href={product.learnMoreUrl} className="text-[#0000ee] underline">
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

        <div className="mt-auto flex items-end justify-between gap-2.5 pt-1">
          {selection === 'single' ? (
            <button
              type="button"
              onClick={() => selectSingle(stepId, product.id)}
              className={clsx(
                'rounded-[4px] border px-3 py-1 text-sm font-medium transition',
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
          <PriceTag
            price={variant.price}
            compareAt={variant.compareAt}
            unit={product.priceUnit}
            align="col"
            tone="card"
          />
        </div>
      </div>
    </article>
  )
}
