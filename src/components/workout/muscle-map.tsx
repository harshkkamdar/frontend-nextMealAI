import { BACK, FRONT, type BodyPart } from './muscle-map-data'
import { cn } from '@/lib/utils'

// Exercise-database muscle names (free-exercise-db vocabulary plus the backend's synonyms) to body polygons.
const GROUPS: Record<string, BodyPart[]> = {
  abdominals: ['abs', 'obliques'], abs: ['abs', 'obliques'], core: ['abs', 'obliques'], obliques: ['obliques'],
  abductors: ['abductors'], adductors: ['adductor'],
  biceps: ['biceps'], triceps: ['triceps'], forearms: ['forearm'], forearm: ['forearm'],
  calves: ['calves', 'left-soleus', 'right-soleus'], calf: ['calves', 'left-soleus', 'right-soleus'],
  chest: ['chest'], pecs: ['chest'],
  glutes: ['gluteal'], glute: ['gluteal'],
  hamstrings: ['hamstring'], hams: ['hamstring'],
  lats: ['upper-back'], 'middle back': ['upper-back'], 'upper back': ['upper-back'], back: ['upper-back', 'lower-back'],
  'lower back': ['lower-back'],
  neck: ['neck'], traps: ['trapezius'], trapezius: ['trapezius'],
  quadriceps: ['quadriceps'], quads: ['quadriceps'],
  shoulders: ['front-deltoids', 'back-deltoids'], delts: ['front-deltoids', 'back-deltoids'],
  legs: ['quadriceps', 'hamstring', 'gluteal', 'calves'],
}

// Used only when the exercise has no muscle group: the common lifts by name, most specific first.
const BY_NAME: Array<[RegExp, BodyPart[]]> = [
  [/romanian|rdl|stiff.?leg|good morning|leg curl|hamstring/, ['hamstring', 'gluteal', 'lower-back']],
  [/deadlift/, ['hamstring', 'gluteal', 'lower-back', 'trapezius']],
  [/squat|leg press|lunge|split squat|step.?up|leg extension/, ['quadriceps', 'gluteal']],
  [/hip thrust|glute bridge|glute/, ['gluteal', 'hamstring']],
  [/calf|calves/, ['calves', 'left-soleus', 'right-soleus']],
  [/bench|push.?up|chest|fly|flye|dip/, ['chest', 'triceps', 'front-deltoids']],
  [/overhead|shoulder press|military|lateral raise|front raise|arnold/, ['front-deltoids', 'back-deltoids', 'triceps']],
  [/rear delt|face pull|reverse fly/, ['back-deltoids', 'upper-back']],
  [/pull.?up|chin.?up|pulldown|pull.?down|row/, ['upper-back', 'biceps', 'back-deltoids']],
  [/shrug/, ['trapezius']],
  [/curl/, ['biceps', 'forearm']],
  [/tricep|pushdown|skull|extension/, ['triceps']],
  [/plank|crunch|sit.?up|ab |abs|core|leg raise|russian twist/, ['abs', 'obliques']],
]

/** Body parts an exercise works: its muscle group when the API names one, else a guess from the lift's name. */
export function musclesFor(group: string | null | undefined, name = ''): BodyPart[] {
  const fromGroup = (group ?? '').toLowerCase().split(/[,/&]| and /).flatMap((part) => GROUPS[part.trim()] ?? [])
  if (fromGroup.length) return [...new Set(fromGroup)]
  const lower = ` ${name.toLowerCase()} `
  return BY_NAME.find(([pattern]) => pattern.test(lower))?.[1] ?? []
}

function Figure({ model, on, color }: { model: typeof FRONT; on: Set<BodyPart>; color: string }) {
  return (
    <svg viewBox="0 0 100 200" className="h-full w-auto" aria-hidden="true">
      {model.map(([part, polygons]) => polygons.map((points, index) => (
        <polygon
          key={`${part}-${index}`}
          points={points}
          fill={on.has(part) ? color : 'var(--color-ink)'}
          fillOpacity={on.has(part) ? 1 : part === 'head' || part === 'knees' ? 0.06 : 0.12}
          stroke="var(--color-card)"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
      )))}
    </svg>
  )
}

/**
 * Front and back target-muscle diagram (decision C7): the body in ink tints, the worked muscles in orange.
 * `tone="ink"` draws them in ink instead, for cards that already carry the orange action (Q18).
 */
export function MuscleMap({ parts, tone = 'accent', className }: { parts: BodyPart[]; tone?: 'accent' | 'ink'; className?: string }) {
  const on = new Set(parts)
  const color = tone === 'ink' ? 'var(--color-ink)' : 'var(--color-accent)'
  return (
    <span className={cn('flex h-full items-center justify-center gap-1', className)}>
      <Figure model={FRONT} on={on} color={color} />
      <Figure model={BACK} on={on} color={color} />
    </span>
  )
}

const PART_NAMES: Partial<Record<BodyPart, string>> = {
  chest: 'Chest', abs: 'Abs', obliques: 'Obliques', biceps: 'Biceps', triceps: 'Triceps', forearm: 'Forearms', 'front-deltoids': 'Shoulders',
  'back-deltoids': 'Shoulders', quadriceps: 'Quads', abductors: 'Hips', adductor: 'Inner thighs', calves: 'Calves', trapezius: 'Traps',
  'upper-back': 'Back', 'lower-back': 'Lower back', gluteal: 'Glutes', hamstring: 'Hamstrings', neck: 'Neck',
}

/** Readable list of what an exercise works, e.g. "Chest · Triceps · Shoulders". */
export function muscleCaption(group: string | null | undefined, name = ''): string {
  if (group?.trim()) return group.trim().replace(/^./, (c) => c.toUpperCase())
  return [...new Set(musclesFor(null, name).map((part) => PART_NAMES[part]).filter(Boolean))].join(' · ')
}

/**
 * The exercise's picture slot. Today it holds the target-muscle diagram (C7); a licensed form image (for example
 * WorkoutLabs) can replace the diagram inside the same fixed box later without moving anything else on the card.
 */
export function ExerciseVisual({ group, name }: { group: string | null | undefined; name: string }) {
  const parts = musclesFor(group, name)
  const caption = muscleCaption(group, name)
  return (
    <figure className="flex h-[68px] items-center gap-3 rounded-[16px] bg-ink-04 pl-4 pr-3" data-slot="exercise-image">
      <figcaption className="min-w-0 flex-1">
        <span className="block text-[12px] font-medium leading-[1.3] text-ink-65">Works</span>
        <span className="mt-0.5 line-clamp-2 block text-[13px] font-semibold leading-[1.3] text-ink">{caption || 'Muscles not listed'}</span>
      </figcaption>
      <MuscleMap parts={parts} className="h-[58px] shrink-0" />
    </figure>
  )
}
