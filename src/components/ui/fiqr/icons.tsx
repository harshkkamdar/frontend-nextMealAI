import type { SVGProps } from 'react'

/**
 * FIQR filled icon set (Q22): tab bar, the + sheet and Home tiles. 24 px grid, currentColor.
 * Everything else keeps lucide outline at stroke 1.75.
 */
type IconProps = SVGProps<SVGSVGElement>

function Svg({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

export function HomeFill(props: IconProps) {
  return <Svg {...props}><path d="M11.3 3.3a1.1 1.1 0 0 1 1.4 0l8 6.6c.5.4.8 1 .8 1.7V19a2 2 0 0 1-2 2h-4.2v-5.3a1.3 1.3 0 0 0-1.3-1.3h-2a1.3 1.3 0 0 0-1.3 1.3V21H4.5a2 2 0 0 1-2-2v-7.4c0-.7.3-1.3.8-1.7l8-6.6Z" /></Svg>
}

export function FoodFill(props: IconProps) {
  return <Svg {...props}><path d="M2.6 11.2h18.8c.5 0 .8.4.8.9-.4 4.6-3.8 8.3-8.4 8.8v.4c0 .4-.4.7-.8.7h-2c-.4 0-.8-.3-.8-.7v-.4C5.6 20.4 2.2 16.7 1.8 12.1c0-.5.3-.9.8-.9Z" /><path d="M8.4 3.2c.4-.3 1-.2 1.2.3.6 1.2.5 2.2-.1 3.1-.4.6-.4 1-.1 1.6.3.5.1 1-.4 1.2-.4.2-.9 0-1.1-.4-.6-1.2-.5-2.2.1-3.1.4-.6.4-1 .1-1.6-.2-.4-.1-.9.3-1.1Zm4.6 0c.4-.3 1-.2 1.2.3.6 1.2.5 2.2-.1 3.1-.4.6-.4 1-.1 1.6.3.5.1 1-.4 1.2-.4.2-.9 0-1.1-.4-.6-1.2-.5-2.2.1-3.1.4-.6.4-1 .1-1.6-.2-.4-.1-.9.3-1.1Z" /></Svg>
}

export function TrainFill(props: IconProps) {
  return <Svg {...props}><rect x="4.2" y="6.5" width="3.6" height="11" rx="1.2" /><rect x="16.2" y="6.5" width="3.6" height="11" rx="1.2" /><rect x="1.5" y="9" width="2.4" height="6" rx="1" /><rect x="20.1" y="9" width="2.4" height="6" rx="1" /><rect x="7.6" y="10.9" width="8.8" height="2.2" rx=".6" /></Svg>
}

export function GeoFill(props: IconProps) {
  return <Svg {...props}><path d="M12 2.8c5.3 0 9.5 3.8 9.5 8.6S17.3 20 12 20c-1 0-2-.1-2.9-.4l-3.9 1.9c-.6.3-1.3-.2-1.1-.9l.8-3.2a8.3 8.3 0 0 1-2.4-6c0-4.8 4.2-8.6 9.5-8.6Z" /></Svg>
}

export function PlusIcon(props: IconProps) {
  return <Svg {...props}><path d="M12 4.2c.6 0 1.1.5 1.1 1.1v5.6h5.6a1.1 1.1 0 1 1 0 2.2h-5.6v5.6a1.1 1.1 0 1 1-2.2 0v-5.6H5.3a1.1 1.1 0 1 1 0-2.2h5.6V5.3c0-.6.5-1.1 1.1-1.1Z" /></Svg>
}

export function CameraFill(props: IconProps) {
  return <Svg {...props}><path d="M9.2 3.8h5.6c.7 0 1.3.4 1.6 1l.7 1.4h2.4a2.5 2.5 0 0 1 2.5 2.5v9.1a2.5 2.5 0 0 1-2.5 2.5H4.5A2.5 2.5 0 0 1 2 17.8V8.7a2.5 2.5 0 0 1 2.5-2.5h2.4l.7-1.4c.3-.6.9-1 1.6-1ZM12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" /></Svg>
}

export function MenuFill(props: IconProps) {
  return <Svg {...props}><path d="M6.5 2.5h11a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2Zm2 5a.9.9 0 0 0 0 1.8h7a.9.9 0 0 0 0-1.8h-7Zm0 3.6a.9.9 0 0 0 0 1.8h7a.9.9 0 0 0 0-1.8h-7Zm0 3.6a.9.9 0 0 0 0 1.8h4a.9.9 0 0 0 0-1.8h-4Z" /></Svg>
}

export function SearchFill(props: IconProps) {
  return <Svg {...props}><path d="M10.5 3a7.5 7.5 0 0 1 6 12l4.2 4.2a1.2 1.2 0 0 1-1.7 1.7L14.8 16.6A7.5 7.5 0 1 1 10.5 3Zm0 2.4a5.1 5.1 0 1 0 0 10.2 5.1 5.1 0 0 0 0-10.2Z" /></Svg>
}

export function WeightFill(props: IconProps) {
  return <Svg {...props}><path d="M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm6 3.2c-2.2 0-4.1.9-5.2 2.3-.3.4-.2.9.1 1.2l1.9 1.6c.3.3.8.3 1.1 0 .6-.5 1.3-.8 2.1-.8s1.5.3 2.1.8c.3.3.8.3 1.1 0l1.9-1.6c.3-.3.4-.8.1-1.2C16.1 7.1 14.2 6.2 12 6.2Zm0 2a.8.8 0 0 0-.8.7l-.2 1.4a1 1 0 1 0 2 0l-.2-1.4a.8.8 0 0 0-.8-.7Z" /></Svg>
}

export function WaterFill(props: IconProps) {
  return <Svg {...props}><path d="M12.8 2.9c2.3 2.8 6.7 8.4 6.7 12.1a7.5 7.5 0 0 1-15 0c0-3.7 4.4-9.3 6.7-12.1a1 1 0 0 1 1.6 0Z" /></Svg>
}

export function SleepFill(props: IconProps) {
  return <Svg {...props}><path d="M10.4 3.1c.6-.1.9.6.6 1.1a7 7 0 0 0 8.8 9.9c.5-.2 1.1.2 1 .8A9.5 9.5 0 1 1 10.4 3.1Z" /></Svg>
}

export function MoodFill(props: IconProps) {
  return <Svg {...props}><path d="M12 2.5a9.5 9.5 0 1 1 0 19 9.5 9.5 0 0 1 0-19ZM8.8 8.4a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Zm6.4 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Zm-7.4 5.4a.9.9 0 0 0-.7 1.4 6 6 0 0 0 9.8 0 .9.9 0 0 0-.7-1.4H7.8Z" /></Svg>
}

export function EnergyFill(props: IconProps) {
  return <Svg {...props}><path d="M13.6 2.3c.5-.6 1.4-.1 1.3.6l-1 6.6h5c.7 0 1.1.8.6 1.4L10.4 21.7c-.5.6-1.4.1-1.3-.6l1-6.6h-5c-.7 0-1.1-.8-.6-1.4L13.6 2.3Z" /></Svg>
}

export function StepsFill(props: IconProps) {
  return <Svg {...props}><path d="M7.6 2.5c1.9 0 3 2 3 4.6 0 1.6-.5 3-.8 4.2-.2.6-.7.9-1.3.9H6.8c-.6 0-1.1-.3-1.3-.9-.3-1.2-.8-2.6-.8-4.2 0-2.6 1-4.6 2.9-4.6Zm-1 11.2h2.6c.6 0 1 .5 1 1v.8a2.3 2.3 0 0 1-4.6 0v-.8c0-.5.4-1 1-1ZM16.4 6.5c1.9 0 2.9 2 2.9 4.6 0 1.6-.5 3-.8 4.2-.2.6-.7.9-1.3.9h-1.6c-.6 0-1.1-.3-1.3-.9-.3-1.2-.8-2.6-.8-4.2 0-2.6 1-4.6 2.9-4.6Zm-1 11.2H18c.6 0 1 .5 1 1v.8a2.3 2.3 0 0 1-4.6 0v-.8c0-.5.4-1 1-1Z" /></Svg>
}

export function CloseIcon(props: IconProps) {
  return <Svg {...props}><path d="M6.2 4.6 12 10.4l5.8-5.8a1.1 1.1 0 1 1 1.6 1.6L13.6 12l5.8 5.8a1.1 1.1 0 1 1-1.6 1.6L12 13.6l-5.8 5.8a1.1 1.1 0 1 1-1.6-1.6l5.8-5.8-5.8-5.8a1.1 1.1 0 0 1 1.6-1.6Z" /></Svg>
}

export function ArrowUpIcon(props: IconProps) {
  return <Svg {...props}><path d="M11.2 4.3a1.1 1.1 0 0 1 1.6 0l6 6a1.1 1.1 0 1 1-1.6 1.6l-4.1-4.1V19a1.1 1.1 0 1 1-2.2 0V7.8l-4.1 4.1a1.1 1.1 0 1 1-1.6-1.6l6-6Z" /></Svg>
}

export function ChevronLeftIcon(props: IconProps) {
  return <Svg {...props}><path d="M15.3 4.3a1.1 1.1 0 0 1 0 1.6L9.2 12l6.1 6.1a1.1 1.1 0 1 1-1.6 1.6l-6.9-6.9a1.1 1.1 0 0 1 0-1.6l6.9-6.9a1.1 1.1 0 0 1 1.6 0Z" /></Svg>
}

export function ChevronRightIcon(props: IconProps) {
  return <Svg {...props}><path d="M8.7 4.3a1.1 1.1 0 0 0 0 1.6l6.1 6.1-6.1 6.1a1.1 1.1 0 1 0 1.6 1.6l6.9-6.9a1.1 1.1 0 0 0 0-1.6L10.3 4.3a1.1 1.1 0 0 0-1.6 0Z" /></Svg>
}

export function PersonFill(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="7.8" r="4.3" /><path d="M12 13.6c4.6 0 8.3 2.7 8.3 6.1 0 .7-.6 1.3-1.3 1.3H5c-.7 0-1.3-.6-1.3-1.3 0-3.4 3.7-6.1 8.3-6.1Z" /></Svg>
}

export function ChartFill(props: IconProps) {
  return <Svg {...props}><rect x="3.5" y="12" width="4" height="8.5" rx="1.4" /><rect x="10" y="7" width="4" height="13.5" rx="1.4" /><rect x="16.5" y="3.5" width="4" height="17" rx="1.4" /></Svg>
}

export function PlayFill(props: IconProps) {
  return <Svg {...props}><path d="M8.4 4.6c-.8-.5-1.9.1-1.9 1.1v12.6c0 1 1.1 1.6 1.9 1.1l10-6.3c.8-.5.8-1.7 0-2.2l-10-6.3Z" /></Svg>
}
