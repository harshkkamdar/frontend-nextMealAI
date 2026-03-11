interface MultiChipProps {
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
}

export function MultiChip({ options, value, onChange }: MultiChipProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(selected ? value.filter((v) => v !== opt) : [...value, opt])}
            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
              selected ? 'bg-brand border-brand text-white' : 'bg-bg-secondary border-border text-foreground hover:border-brand/50'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
