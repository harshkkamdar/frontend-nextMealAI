export const queryKeys = {
  profile: () => ['profile'] as const,
  onboardingStatus: () => ['onboarding-status'] as const,
  logsSummary: (period: string) => ['logs-summary', period] as const,
  logs: (params?: Record<string, string>) => ['logs', params] as const,
  plans: (params?: Record<string, unknown>) => ['plans', params] as const,
  plan: (id: string) => ['plan', id] as const,
  chatSessions: () => ['chat-sessions'] as const,
  chatSession: (sessionId: string) => ['chat-session', sessionId] as const,
  settings: () => ['settings'] as const,
  suggestions: (params?: Record<string, string>) => ['suggestions', params] as const,
} as const
