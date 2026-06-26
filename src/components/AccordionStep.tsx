import clsx from 'clsx'
import { getCatalog } from '../data/catalog'
import { type Step } from '../types'
import { useBundleStore } from '../store/useBundleStore'
import { useSelectedCount } from '../store/selectors'
import { ProductCard } from './ProductCard'
import { Icon } from './Icon'

interface Props {
  step: Step
  index: number
}

export function AccordionStep({ step, index }: Props) {
  const catalog = getCatalog()
  const open = useBundleStore((s) => s.openStepId === step.id)
  const count = useSelectedCount(step.id)
  const nextStep = catalog.steps[index + 1]

  return (
    <section className="border-b border-line last:border-b-0">
      <p
        className={clsx(
          'px-5 pt-3 text-[12px] font-medium uppercase tracking-[0.08em] text-muted',
          open && 'bg-panel',
        )}
      >
        Step {index + 1} of 4
      </p>

      <button
        type="button"
        onClick={() => useBundleStore.getState().openStep(step.id)}
        className={clsx('flex w-full items-center gap-3 px-5 pb-3 pt-2 text-left', open && 'bg-panel')}
      >
        <Icon name={step.icon} className="shrink-0 text-ink" />
        <h2
          className={clsx(
            'flex-1 font-semibold text-heading',
            open ? 'text-[22px]' : 'text-lg',
          )}
        >
          {step.title}
        </h2>
        <span className="text-sm font-medium text-accent">{count} selected</span>
        <Icon
          name="chevron"
          className={clsx('shrink-0 text-accent transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="bg-panel px-5 pb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {step.productIds.map((pid) => (
              <ProductCard
                key={pid}
                product={catalog.products[pid]}
                selection={step.selection}
                stepId={step.id}
              />
            ))}
          </div>

          {nextStep && (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => useBundleStore.getState().openStep(nextStep.id)}
                className="rounded-lg border border-accent px-5 py-2 text-sm font-medium text-accent transition hover:bg-accent-soft"
              >
                {step.nextLabel ?? `Next: ${nextStep.title}`}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
