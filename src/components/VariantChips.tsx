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
            'flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium uppercase tracking-wide transition',
            v.id === active ? 'border-accent text-ink' : 'border-line text-muted hover:border-accent/50',
          )}
        >
          <span
            className="h-3.5 w-3.5 rounded-full border border-line"
            style={{ background: v.swatch }}
          />
          {v.label}
        </button>
      ))}
    </div>
  )
}
