'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { User, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { getSettings, updateSettings } from '@/lib/api/settings.api'
import { queryKeys } from '@/lib/query-keys'
import { useAuthStore } from '@/stores/auth.store'
import type { SettingsUpdateInput } from '@/types/settings.types'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-brand' : 'bg-muted'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

const personalityOptions = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'supportive', label: 'Supportive' },
  { value: 'direct', label: 'Direct' },
  { value: 'data_driven', label: 'Data-Driven' },
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

  function patch(update: SettingsUpdateInput) {
    if (!settings) return
    save(update)
  }

  if (isLoading || !settings) {
    return (
      <PageWrapper>
        <CardSkeleton />
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
      <div className="bg-bg-secondary rounded-2xl p-5 mb-4 space-y-3">
        <h2 className="font-semibold text-foreground">Geo Personality</h2>
        <div className="flex flex-wrap gap-2">
          {personalityOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => patch({ geo_personality: opt.value })}
              className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                settings.geo_personality === opt.value
                  ? 'bg-brand border-brand text-white'
                  : 'bg-bg-primary border-border text-foreground hover:border-brand/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-apply suggestions */}
      <div className="bg-bg-secondary rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 pr-4">
            <p className="font-medium text-foreground">Auto-apply suggestions</p>
            <p className="text-sm text-muted-foreground mt-0.5">Geo will apply plan adjustments automatically</p>
          </div>
          <Toggle
            checked={settings.auto_apply_suggestions}
            onChange={(v) => patch({ auto_apply_suggestions: v })}
          />
        </div>
      </div>

      {/* Notification time */}
      <div className="bg-bg-secondary rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <p className="font-medium text-foreground">Notification time</p>
          <input
            type="time"
            defaultValue={settings.notification_time?.slice(0, 5)}
            onBlur={(e) => patch({ notification_time: e.target.value + ':00' })}
            className="bg-bg-primary border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-brand/50"
          />
        </div>
      </div>

      {/* Notifications enabled */}
      <div className="bg-bg-secondary rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1 pr-4">
            <p className="font-medium text-foreground">Notifications</p>
            <p className="text-sm text-muted-foreground mt-0.5">Receive updates and reminders from Geo</p>
          </div>
          <Toggle
            checked={settings.notifications_enabled}
            onChange={(v) => patch({ notifications_enabled: v })}
          />
        </div>
      </div>
    </PageWrapper>
  )
}
