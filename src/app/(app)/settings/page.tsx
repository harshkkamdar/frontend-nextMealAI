'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { User, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { getSettings, updateSettings } from '@/lib/api/settings.api'
import { queryKeys } from '@/lib/query-keys'
import type { GeoTone, GeoVerbosity, GeoEmojiUsage } from '@/types/settings.types'
import { useAuthStore } from '@/stores/auth.store'

// Chip selector for small option sets
function ChipSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
            value === opt.value
              ? 'bg-brand border-brand text-white'
              : 'bg-bg-secondary border-border text-foreground hover:border-brand/50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// Toggle switch
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-brand' : 'bg-muted'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

const toneOptions: Array<{ value: GeoTone; label: string }> = [
  { value: 'supportive', label: 'Supportive' },
  { value: 'direct', label: 'Direct' },
  { value: 'data_driven', label: 'Data-Driven' },
  { value: 'balanced', label: 'Balanced' },
]

const verbosityOptions: Array<{ value: GeoVerbosity; label: string }> = [
  { value: 'concise', label: 'Concise' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'detailed', label: 'Detailed' },
]

const emojiOptions: Array<{ value: GeoEmojiUsage; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'frequent', label: 'Frequent' },
]

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const { data: settings, isLoading } = useQuery({
    queryKey: queryKeys.settings(),
    queryFn: getSettings,
  })

  const { mutate: save } = useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.settings(), data)
    },
    onError: () => {
      toast.error('Failed to save settings')
    },
  })

  function patch(update: Parameters<typeof updateSettings>[0]) {
    if (!settings) return
    save(update)
  }

  if (isLoading || !settings) {
    return (
      <PageWrapper>
        <CardSkeleton />
        <div className="mt-4"><CardSkeleton /></div>
        <div className="mt-4"><CardSkeleton /></div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <h1 className="text-xl font-bold text-foreground mb-6">Settings</h1>

      {/* Profile Summary */}
      <Link
        href="/settings/profile"
        className="flex items-center gap-3 bg-bg-secondary rounded-2xl p-4 mb-4 hover:bg-bg-secondary/80 transition-colors"
      >
        <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
          <User size={20} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">{user?.email}</p>
          <p className="text-sm text-muted-foreground">Edit profile &amp; goals</p>
        </div>
        <ChevronRight size={18} className="text-muted-foreground" />
      </Link>

      {/* Geo Personality */}
      <div className="bg-bg-secondary rounded-2xl p-5 mb-4 space-y-5">
        <h2 className="font-semibold text-foreground">Geo Personality</h2>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Tone</p>
          <ChipSelector
            options={toneOptions}
            value={settings.geo_personality.tone}
            onChange={(tone) => patch({ geo_personality: { ...settings.geo_personality, tone } })}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Verbosity</p>
          <ChipSelector
            options={verbosityOptions}
            value={settings.geo_personality.verbosity}
            onChange={(verbosity) => patch({ geo_personality: { ...settings.geo_personality, verbosity } })}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Emoji usage</p>
          <ChipSelector
            options={emojiOptions}
            value={settings.geo_personality.emoji_usage}
            onChange={(emoji_usage) => patch({ geo_personality: { ...settings.geo_personality, emoji_usage } })}
          />
        </div>
      </div>

      {/* Auto-apply edits */}
      <div className="bg-bg-secondary rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 pr-4">
            <p className="font-medium text-foreground">Auto-apply edits</p>
            <p className="text-sm text-muted-foreground mt-0.5">Geo will apply minor plan adjustments automatically</p>
          </div>
          <Toggle
            checked={settings.auto_apply_edits}
            onChange={(auto_apply_edits) => patch({ auto_apply_edits })}
          />
        </div>
      </div>

      {/* Daily evaluation time */}
      <div className="bg-bg-secondary rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <p className="font-medium text-foreground">Daily evaluation time</p>
          <input
            type="time"
            value={settings.daily_evaluation_time}
            onBlur={(e) => patch({ daily_evaluation_time: e.target.value })}
            className="bg-bg-primary border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-brand/50"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-bg-secondary rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Notifications</h2>
        {(
          [
            { key: 'push_enabled', label: 'Push notifications' },
            { key: 'email_enabled', label: 'Email notifications' },
            { key: 'daily_summary', label: 'Daily summary' },
            { key: 'plan_suggestions', label: 'Plan suggestions' },
          ] as const
        ).map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <p className="text-sm text-foreground">{label}</p>
            <Toggle
              checked={settings.notifications[key]}
              onChange={(value) =>
                patch({ notifications: { ...settings.notifications, [key]: value } })
              }
            />
          </div>
        ))}
      </div>
    </PageWrapper>
  )
}
