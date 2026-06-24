import { getCatalog } from '../data/catalog'
import { AccordionStep } from './AccordionStep'

export function BuilderColumn() {
  const catalog = getCatalog()
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      {catalog.steps.map((step, i) => (
        <AccordionStep key={step.id} step={step} index={i} />
      ))}
    </div>
  )
}
