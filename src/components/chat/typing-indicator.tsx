'use client'

import { GeoAvatar } from '@/components/shared/geo-avatar'
import { motion } from 'framer-motion'

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <GeoAvatar size="sm" />
      <div className="bg-background border border-border rounded-2xl rounded-bl-none px-4 py-3 flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-muted-foreground"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  )
}
