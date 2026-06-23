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
    'grid place-items-center rounded-md border border-line text-ink transition',
    'enabled:hover:border-accent enabled:hover:text-accent',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    size === 'sm' ? 'h-6 w-6' : 'h-8 w-8',
  )
  const glyph = size === 'sm' ? 12 : 14
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
      <span className={clsx('text-center tabular-nums', size === 'sm' ? 'w-4 text-sm' : 'w-5')}>
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
