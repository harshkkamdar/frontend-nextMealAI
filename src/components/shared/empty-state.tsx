import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <Icon className="w-10 h-10 text-text-tertiary mb-3" />
      <p className="text-sm font-medium text-text-primary">{title}</p>
      <p className="text-xs text-text-secondary mt-1 max-w-[240px]">
        {description}
      </p>
      {children && <div className="mt-4">{children}</div>}
    </motion.div>
  )
}
