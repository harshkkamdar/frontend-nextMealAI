export const queryKeys = {
  profile: () => ['profile'] as const,
  onboardingStatus: () => ['onboarding-status'] as const,
  logsSummary: (period: string) => ['logs-summary', period] as const,
  logs: (params?: Record<string, string>) =>
    params ? (['logs', params] as const) : (['logs'] as const),
  plans: (params?: Record<string, unknown>) =>
    params ? (['plans', params] as const) : (['plans'] as const),
  plan: (id: string) => ['plan', id] as const,
  chatSessions: () => ['chat-sessions'] as const,
  chatSession: (sessionId: string) => ['chat-session', sessionId] as const,
  settings: () => ['settings'] as const,
  suggestions: (params?: Record<string, string>) =>
    params ? (['suggestions', params] as const) : (['suggestions'] as const),
}
