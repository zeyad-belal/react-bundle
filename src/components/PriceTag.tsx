import clsx from 'clsx'
import { formatMoney } from '../store/selectors'

interface Props {
  price: number
  compareAt: number | null
  unit?: 'each' | 'mo'
  align?: 'row' | 'col'
  /** card = red struck + gray active (16px); review = gray struck + purple active (14px). */
  tone?: 'card' | 'review'
}

export function PriceTag({ price, compareAt, unit = 'each', align = 'row', tone = 'review' }: Props) {
  const suffix = unit === 'mo' ? '/mo' : ''
  const active = price === 0 ? 'FREE' : `${formatMoney(price)}${suffix}`

  const struckCls = tone === 'card' ? 'text-[#d8392b]' : 'text-muted'
  const activeCls =
    tone === 'card' ? 'text-[#575757]' : 'font-semibold text-accent'
  const sizeCls = tone === 'card' ? 'text-[16px]' : 'text-sm'

  return (
    <div
      className={clsx(
        'flex gap-1',
        sizeCls,
        align === 'col' ? 'flex-col items-end' : 'items-center gap-1.5',
      )}
    >
      {compareAt != null && (
        <span className={clsx('line-through', struckCls)}>
          {formatMoney(compareAt)}
          {suffix}
        </span>
      )}
      <span className={activeCls}>{active}</span>
    </div>
  )
}
