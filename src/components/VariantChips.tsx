import clsx from 'clsx'
import type { Variant } from '../types'

interface Props {
  variants: Variant[]
  active: string
  onSelect: (id: string) => void
}

export function VariantChips({ variants, active, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {variants.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onSelect(v.id)}
          className={clsx(
            'flex h-[26px] items-center justify-center gap-1 rounded-[2px] border-[0.5px] px-1.5 text-[10px] font-medium uppercase tracking-[0.04em] text-heading transition',
            v.id === active
              ? 'border-save bg-[rgba(29,240,187,0.04)]'
              : 'border-[#cccccc] bg-white hover:border-accent/50',
          )}
        >
          <span
            className="h-[18px] w-[18px] rounded-[4px] border border-line"
            style={{ background: v.swatch }}
          />
          {v.label}
        </button>
      ))}
    </div>
  )
}
