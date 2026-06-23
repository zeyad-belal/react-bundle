import catalogJson from '../data/catalog.json'
import { type Catalog } from '../types'
import { AccordionStep } from './AccordionStep'

const catalog = catalogJson as Catalog

export function BuilderColumn() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      {catalog.steps.map((step, i) => (
        <AccordionStep key={step.id} step={step} index={i} />
      ))}
    </div>
  )
}
