interface PageWrapperProps {
  children: React.ReactNode
  className?: string
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <div className={`max-w-md mx-auto px-4 py-6 ${className ?? ''}`}>
      {children}
    </div>
  )
}
