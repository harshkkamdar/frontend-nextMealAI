'use client'

/**
 * R6-10 — tappable option chips under Geo's last message. When Geo asks the
 * user to choose from a small set ("which food?", "which day?"), tapping a chip
 * sends that exact text as the next message — no typing. Rendered only for the
 * most recent assistant message (see the surfaces that mount it).
 */
export function SuggestedReplies({
  options,
  onSelect,
  disabled,
}: {
  options: string[]
  onSelect: (value: string) => void
  disabled?: boolean
}) {
  if (!options || options.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-2" data-testid="suggested-replies">
      {options.map((opt, i) => (
        <button
          key={`${opt}-${i}`}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(opt)}
          className="h-9 rounded-full border border-ink-16 bg-cream px-3 text-[13.5px] font-semibold text-ink active:bg-ink-08 disabled:opacity-50"
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
