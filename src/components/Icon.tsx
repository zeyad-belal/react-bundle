import type { SVGProps } from 'react'

const paths: Record<string, string> = {
  minus: 'M5 12h14',
  plus: 'M12 5v14M5 12h14',
  chevron: 'M6 9l6 6 6-6',
  camera: 'M3 8h3l2-2h8l2 2h3v11H3zM12 17a3 3 0 100-6 3 3 0 000 6z',
  shield: 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z',
  sensor: 'M12 12a3 3 0 100-6 3 3 0 000 6zM6 18c1.5-2 3.7-3 6-3s4.5 1 6 3',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  truck: 'M3 6h11v9H3zM14 9h4l3 3v3h-7zM7 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
}

export function Icon({ name, ...rest }: { name: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={20}
      height={20}
      aria-hidden="true"
      {...rest}
    >
      <path d={paths[name] ?? ''} />
    </svg>
  )
}
