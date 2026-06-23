import clsx from 'clsx'
import { formatMoney } from '../store/selectors'

interface Props {
  price: number
  compareAt: number | null
  unit?: 'each' | 'mo'
  align?: 'row' | 'col'
}

export function PriceTag({ price, compareAt, unit = 'each', align = 'row' }: Props) {
  const suffix = unit === 'mo' ? '/mo' : ''
  const active = price === 0 ? 'FREE' : `${formatMoney(price)}${suffix}`
  return (
    <div
      className={clsx(
        'flex gap-1.5 text-sm',
        align === 'col' ? 'flex-col items-end' : 'items-center',
      )}
    >
      {compareAt != null && (
        <span className="text-muted line-through">
          {formatMoney(compareAt)}
          {suffix}
        </span>
      )}
      <span className="font-semibold text-accent">{active}</span>
    </div>
  )
}
