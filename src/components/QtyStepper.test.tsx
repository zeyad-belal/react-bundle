import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QtyStepper } from './QtyStepper'

describe('QtyStepper', () => {
  it('fires callbacks and disables minus when requested', async () => {
    const onInc = vi.fn()
    const onDec = vi.fn()
    render(<QtyStepper value={0} onIncrement={onInc} onDecrement={onDec} minusDisabled />)
    expect(screen.getByText('0')).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('Increase quantity'))
    expect(onInc).toHaveBeenCalledOnce()
    const minus = screen.getByLabelText('Decrease quantity')
    expect(minus).toBeDisabled()
  })
})
