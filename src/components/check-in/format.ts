const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'] as const

export function numberWord(value: number): string {
  return NUMBER_WORDS[value] ?? String(value)
}

export function formatMetric(value: number | null): string {
  return value === null ? '—' : value.toLocaleString()
}

export function formatDelta(value: number): string {
  if (value > 0) return `+${value.toFixed(1)}`
  if (value < 0) return `−${Math.abs(value).toFixed(1)}`
  return '0.0'
}
