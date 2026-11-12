/**
 * The FIQR mark as FIQR Logo.dc.html draws it, on a 100 unit box: a ring (outer radius 35, centre 50,50) whose stroke is
 * 9% of its outer diameter, and a short orange bar, 33% of that diameter long, at -45 deg just off its lower right.
 * The bar sits in its own group so a motion class can turn it round the ring without losing its own -45 deg.
 */
export function MarkShapes({ ring, ringOpacity = 1, barClassName }: { ring: string; ringOpacity?: number; barClassName?: string }) {
  return (
    <>
      <circle cx="50" cy="50" r="31.87" fill="none" stroke={ring} strokeOpacity={ringOpacity} strokeWidth="6.25" />
      <g className={barClassName}>
        <rect x="62.22" y="79.11" width="23.72" height="6.83" rx="1.44" fill="#E8622A" transform="rotate(-45 74.08 82.52)" />
      </g>
    </>
  )
}
