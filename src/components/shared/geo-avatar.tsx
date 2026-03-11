interface GeoAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-lg',
  lg: 'w-16 h-16 text-2xl',
}

export function GeoAvatar({ size = 'md', className }: GeoAvatarProps) {
  return (
    <div
      className={`${sizes[size]} rounded-full bg-brand flex items-center justify-center font-bold text-white ${className ?? ''}`}
    >
      G
    </div>
  )
}
