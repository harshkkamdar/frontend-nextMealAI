import { Badge } from '@/components/ui/badge'

interface ConfidenceBadgeProps {
  confidence: number // 0-1 float or 0-100 int
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const pct = confidence > 1 ? confidence : Math.round(confidence * 100)
  const color =
    pct >= 80
      ? 'bg-success/20 text-success border-success/30'
      : pct >= 60
        ? 'bg-warning/20 text-warning border-warning/30'
        : 'bg-muted text-muted-foreground'

  return (
    <Badge variant="outline" className={`text-xs ${color}`}>
      {pct}% confident
    </Badge>
  )
}
