import { useState } from 'react'
import { getCatalog } from '../data/catalog'
import { useTotals, formatMoney } from '../store/selectors'
import { useBundleStore } from '../store/useBundleStore'
import { PriceTag } from './PriceTag'
import { GuaranteeBadge } from './GuaranteeBadge'
import { Icon } from './Icon'

export function SummaryFooter() {
  const { total, preDiscount, savings } = useTotals()
  const saved = useBundleStore((s) => s.saved)
  const [placed, setPlaced] = useState(false)
  const { shipping, financingLabel } = getCatalog().summary

  return (
    <div className="space-y-4 pt-3">
      <div className="flex items-center gap-3 border-t border-divider pt-4">
        <span className="grid h-[41px] w-[41px] place-items-center rounded-[5px] border border-line bg-white text-ink">
          <Icon name="truck" />
        </span>
        <span className="flex-1 text-sm text-ink">{shipping.label}</span>
        <PriceTag price={shipping.price} compareAt={shipping.compareAt} align="col" />
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <GuaranteeBadge />
        <div className="flex flex-col items-end gap-2">
          <span className="inline-block rounded-[3px] bg-accent px-2 py-[5px] text-xs font-medium tracking-tight text-white">
            {financingLabel}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-[18px] text-muted line-through">{formatMoney(preDiscount)}</span>
            <span className="text-[24px] font-bold leading-8 text-accent">{formatMoney(total)}</span>
          </div>
        </div>
      </div>

      <p className="pt-2.5 text-center text-xs font-semibold text-save">
        Congrats! You&apos;re saving {formatMoney(savings)} on your security bundle!
      </p>

      <button
        type="button"
        onClick={() => {
          useBundleStore.getState().saveForLater()
          setPlaced(true)
        }}
        className="w-full rounded-[4px] bg-accent py-[13px] text-[17px] font-bold text-white transition hover:opacity-95"
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
        className="block w-full text-center text-sm italic text-faint underline underline-offset-2 hover:text-ink"
      >
        {saved ? 'Saved ✓ — Save my system for later' : 'Save my system for later'}
      </button>
    </div>
  )
}
