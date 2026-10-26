import type { SVGProps } from 'react'

/** Outline icons drawn for the Today mock (journey-today.html): Geo's mark, the four macros, Health rows. 24 px grid, currentColor. */
type IconProps = SVGProps<SVGSVGElement>

function Line({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

export const SparkleIcon = (p: IconProps) => <Line {...p}><path d="M12 3.5c.6 3.9 2.4 5.8 6.5 6.5-4.1.7-5.9 2.6-6.5 6.5-.6-3.9-2.4-5.8-6.5-6.5 4.1-.7 5.9-2.6 6.5-6.5zM18.5 16.5c.2 1.4.8 2 2 2.2-1.2.2-1.8.8-2 2.2-.2-1.4-.8-2-2-2.2 1.2-.2 1.8-.8 2-2.2z" /></Line>
export const FlameIcon = (p: IconProps) => <Line {...p}><path d="M12 3.5c.6 3.2-3.8 5.2-3.8 9.6a3.8 3.8 0 0 0 7.6 0c0-1.7-.8-3-1.7-4 .1 1.7-.6 2.7-1.5 2.9.6-2.9-.2-6.3-.6-8.5z" /></Line>
export const ProteinIcon = (p: IconProps) => <Line {...p}><path d="M15.5 4.5a4 4 0 0 1 4 4c0 3-3.5 5.5-6.5 5.5L9.2 17.8a1.8 1.8 0 1 1-2.7-.2 1.8 1.8 0 1 1-.2-2.7L10 11c0-3 2.5-6.5 5.5-6.5z" /></Line>
export const CarbsIcon = (p: IconProps) => <Line {...p}><path d="M12 21V9M12 9c-1.9-.6-3-2.4-3-4.8 1.9.4 3 1.8 3 3.6 0-1.8 1.1-3.2 3-3.6 0 2.4-1.1 4.2-3 4.8zM12 14c-2-.3-3.5-1.8-3.9-4 2 .2 3.4 1.5 3.9 3.4.5-1.9 1.9-3.2 3.9-3.4-.4 2.2-1.9 3.7-3.9 4zM12 18.5c-2-.3-3.5-1.8-3.9-4 2 .2 3.4 1.5 3.9 3.4.5-1.9 1.9-3.2 3.9-3.4-.4 2.2-1.9 3.7-3.9 4z" /></Line>
export const FatIcon = (p: IconProps) => <Line {...p}><path d="M12 4c3 3.5 5 6.4 5 9a5 5 0 0 1-10 0c0-2.6 2-5.5 5-9z" /><path d="M9.8 14.2a2.3 2.3 0 0 0 2.2 2.3" /></Line>
export const HeartIcon = (p: IconProps) => <Line {...p}><path d="M12 19.5s-7.5-4.4-7.5-9.7A4.1 4.1 0 0 1 12 7.4a4.1 4.1 0 0 1 7.5 2.4c0 5.3-7.5 9.7-7.5 9.7z" /></Line>
export const AlertIcon = (p: IconProps) => <Line {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5.5M12 16.2v.1" /></Line>
export const PlusLine = (p: IconProps) => <Line {...p}><path d="M12 5v14M5 12h14" /></Line>
export const MinusLine = (p: IconProps) => <Line {...p}><path d="M5 12h14" /></Line>
export const StepsLine = (p: IconProps) => <Line {...p}><path d="M8.5 3.5c1.8 0 2.7 2 2.5 4.5-.2 2.2-1 3.5-2.6 3.5S6 10.2 6 8c0-2.6 1-4.5 2.5-4.5zM6.5 14h4.2l-.4 3.3a2 2 0 0 1-3.9-.3zM15.5 7.5c1.5 0 2.5 1.9 2.5 4.5 0 2.2-.8 3.5-2.4 3.5s-2.4-1.3-2.6-3.5c-.2-2.5.7-4.5 2.5-4.5zM13.4 18h4.2l-.3 1.4a2 2 0 0 1-3.9.3z" /></Line>
export const WeightLine = (p: IconProps) => <Line {...p}><path d="M5 5h14l-1.5 15h-11z" /><path d="M9.5 10a2.5 2.5 0 0 1 5 0M12 10l1.2-1.6" /></Line>
export const SleepLine = (p: IconProps) => <Line {...p}><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" /></Line>
export const TrainLine = (p: IconProps) => <Line {...p}><path d="M6.5 7.5v9M3.5 10v4m14-6.5v9m3-6.5v4M6.5 12h11" /></Line>
export const ChartLine = (p: IconProps) => <Line {...p}><path d="M5 19V11M10 19V6M15 19v-5M20 19V9" /></Line>
