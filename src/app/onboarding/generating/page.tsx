'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { Button } from '@/components/ui/button'
import { sendMessage } from '@/lib/api/chat.api'
import { ApiException } from '@/types/api.types'
import { v4 as uuidv4 } from 'uuid'

const messages = [
  'Analyzing your profile...',
  'Calculating your macro targets...',
  'Building your 7-day meal plan...',
  'Designing your workout program...',
  'Almost ready...',
]

export default function GeneratingPage() {
  const router = useRouter()
  const [messageIndex, setMessageIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(true)

  async function generatePlan() {
    setIsGenerating(true)
    setError(null)

    // Cycle messages while waiting
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % messages.length)
    }, 2000)

    try {
      await sendMessage({
        message: 'Generate my initial 7-day meal and workout plan based on my profile.',
        session_id: uuidv4(),
      })
      clearInterval(interval)
      // Set onboarded cookie so middleware knows
      document.cookie = 'nextmealai-onboarded=true; path=/; max-age=300'
      router.push('/dashboard')
    } catch (err) {
      clearInterval(interval)
      setIsGenerating(false)
      if (err instanceof ApiException) {
        setError(err.message || 'Plan generation failed. Please try again.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    }
  }

  useEffect(() => {
    generatePlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center gap-6 p-8">
        <GeoAvatar size="lg" />
        <div className="text-center">
          <p className="text-foreground font-semibold">Plan generation failed</p>
          <p className="text-muted-foreground text-sm mt-2">{error}</p>
        </div>
        <Button onClick={generatePlan} className="bg-brand hover:bg-brand/90 text-white">
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center gap-8 p-8">
      {/* Animated Geo avatar */}
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <GeoAvatar size="lg" />
        </motion.div>
        {/* Pulse rings */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-brand"
            animate={{ scale: [1, 2 + i * 0.3], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
          />
        ))}
      </div>

      {/* Cycling message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-foreground text-lg font-medium text-center"
        >
          {messages[messageIndex]}
        </motion.p>
      </AnimatePresence>

      <p className="text-muted-foreground text-sm text-center">
        Building your personalized plan — this takes a moment
      </p>
    </div>
  )
}
