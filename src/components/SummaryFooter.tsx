import { useState } from 'react'
import catalogJson from '../data/catalog.json'
import { type Catalog } from '../types'
import { useTotals, formatMoney } from '../store/selectors'
import { useBundleStore } from '../store/useBundleStore'
import { PriceTag } from './PriceTag'
import { GuaranteeBadge } from './GuaranteeBadge'
import { Icon } from './Icon'

const catalog = catalogJson as Catalog

export function SummaryFooter() {
  const { total, preDiscount, savings } = useTotals()
  const saved = useBundleStore((s) => s.saved)
  const [placed, setPlaced] = useState(false)
  const { shipping, financingLabel } = catalog.summary

  return (
    <div className="space-y-4 pt-3">
      <div className="flex items-center gap-3 border-t border-line pt-4">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-white text-save">
          <Icon name="truck" />
        </span>
        <span className="flex-1 text-sm font-medium text-ink">{shipping.label}</span>
        <PriceTag price={shipping.price} compareAt={shipping.compareAt} />
      </div>

      <div className="flex items-center gap-4 border-t border-line pt-4">
        <GuaranteeBadge />
        <div className="flex-1">
          <span className="inline-block rounded bg-accent px-2 py-0.5 text-xs font-medium text-white">
            {financingLabel}
          </span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-muted line-through">{formatMoney(preDiscount)}</span>
            <span className="text-2xl font-bold text-accent">{formatMoney(total)}</span>
          </div>
        </div>
      </div>

      <p className="text-center text-sm font-medium text-save">
        Congrats! You&apos;re saving {formatMoney(savings)} on your security bundle!
      </p>

      <button
        type="button"
        onClick={() => {
          useBundleStore.getState().saveForLater()
          setPlaced(true)
        }}
        className="w-full rounded-xl bg-accent py-3 font-semibold text-white transition hover:opacity-95"
      >
        Checkout
      </button>

      {placed && (
        <p className="text-center text-sm font-medium text-save">
          🎉 Order placed — this is a demo, nothing was charged.
        </p>
      )}

      <button
        type="button"
        onClick={() => useBundleStore.getState().saveForLater()}
        className="block w-full text-center text-sm italic text-muted underline underline-offset-2 hover:text-ink"
      >
        {saved ? 'Saved ✓ — Save my system for later' : 'Save my system for later'}
      </button>
    </div>
  )
}
