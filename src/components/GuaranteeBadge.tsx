/**
 * Scalloped "satisfaction guarantee" seal. The scalloped edge is built by rotating
 * a small circle around the center; text sits on top.
 */
export function GuaranteeBadge({ size = 80 }: { size?: number }) {
  const scallops = Array.from({ length: 22 }, (_, i) => {
    const angle = (i / 22) * Math.PI * 2
    const r = 44
    return { cx: 50 + r * Math.cos(angle), cy: 50 + r * Math.sin(angle) }
  })
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="shrink-0" aria-hidden="true">
      {scallops.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={7} fill="var(--color-accent)" />
      ))}
      <circle cx={50} cy={50} r={44} fill="var(--color-accent)" />
      <circle cx={50} cy={50} r={40} fill="none" stroke="white" strokeWidth={1.5} strokeOpacity={0.6} />
      <text x={50} y={46} textAnchor="middle" fill="white" fontSize={20} fontWeight={700}>
        100%
      </text>
      <text x={50} y={60} textAnchor="middle" fill="white" fontSize={8.5} fontWeight={600}>
        Wyze
      </text>
      <text x={50} y={70} textAnchor="middle" fill="white" fontSize={6.5} letterSpacing={0.3}>
        satisfaction
      </text>
    </svg>
  )
}
