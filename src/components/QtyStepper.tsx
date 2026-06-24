import clsx from 'clsx'
import { Icon } from './Icon'

interface Props {
  value: number
  onIncrement: () => void
  onDecrement: () => void
  minusDisabled?: boolean
  size?: 'md' | 'sm'
}

export function QtyStepper({
  value,
  onIncrement,
  onDecrement,
  minusDisabled,
  size = 'md',
}: Props) {
  const btn = clsx(
    'grid place-items-center rounded-[4px] border border-line bg-white text-ink transition',
    'enabled:hover:border-accent enabled:hover:text-accent',
    'disabled:bg-[#f1f1f2] disabled:text-muted disabled:cursor-not-allowed',
    size === 'sm' ? 'h-5 w-5' : 'h-7 w-7',
  )
  const glyph = size === 'sm' ? 8 : 11
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={btn}
        aria-label="Decrease quantity"
        disabled={minusDisabled}
        onClick={onDecrement}
      >
        <Icon name="minus" width={glyph} height={glyph} />
      </button>
      <span
        className={clsx(
          'text-center tabular-nums text-ink',
          size === 'sm' ? 'w-4 text-sm font-semibold' : 'w-5 text-[16px] font-medium',
        )}
      >
        {value}
      </span>
      <button
        type="button"
        className={btn}
        aria-label="Increase quantity"
        onClick={onIncrement}
      >
        <Icon name="plus" width={glyph} height={glyph} />
      </button>
    </div>
  )
}
