/**
 * Geo echoes every food it logs as a receipt line (backend prompt rule: "Logged apple 350g · 182 cal · 0.6g P ·
 * 48g C · 0.6g F"). The reply carries no structured food data, so the chat reads those lines back into rows with
 * numbers (Q25). Display only: nothing is sent or saved from here.
 */
export interface LoggedFood {
  name: string
  /** Breakfast, lunch, dinner or snack when Geo named it ("to lunch"). */
  meal: string | null
  kcal: number
  protein: number | null
  carbs: number | null
  fat: number | null
  estimated: boolean
}

export interface ParsedReply {
  /** Reply text with the receipt lines taken out. */
  text: string
  foods: LoggedFood[]
}

const SEP = String.raw`\s+[·—–]\s+`
const KCAL = new RegExp(`^(.+?)${SEP}~?([\\d,]+(?:\\.\\d+)?)\\s*k?cal\\b(.*)$`, 'i')
const MEAL = /\s+(?:to|for|at)\s+(?:your\s+|today's\s+)?(breakfast|lunch|dinner|snacks?)\b/i

const num = (value: string | undefined) => (value === undefined ? null : Number(value.replace(/,/g, '')))
const macro = (rest: string, letter: string) => num(rest.match(new RegExp(`~?(\\d+(?:\\.\\d+)?)\\s*g\\s*${letter}\\b`, 'i'))?.[1])

/** One receipt line, or null. `inList` accepts a bullet without the word "Logged" (a "Logged to lunch:" list). */
export function parseFoodLine(raw: string, inList = false): LoggedFood | null {
  const bullet = /^\s*(?:[-*•]|\d+\.)\s+/.test(raw)
  const line = raw.replace(/^\s*(?:[-*•]|\d+\.)\s+/, '').replace(/\*\*/g, '').trim()
  const logged = /^logged\s+/i.test(line)
  if (!logged && !(inList && bullet)) return null
  const match = line.replace(/^logged\s+/i, '').match(KCAL)
  if (!match) return null
  const [, head, kcal, rest] = match
  const meal = head.match(MEAL)?.[1] ?? null
  const name = head.replace(MEAL, '').replace(/^~\s*/, '').trim()
  if (!name) return null
  return {
    name: name[0].toUpperCase() + name.slice(1),
    meal: meal ? meal[0].toUpperCase() + meal.slice(1).toLowerCase() : null,
    kcal: num(kcal) ?? 0,
    protein: macro(rest, 'P'),
    carbs: macro(rest, 'C'),
    fat: macro(rest, 'F'),
    estimated: /estimat|~/i.test(raw),
  }
}

export function parseLoggedFoods(content: string): ParsedReply {
  const foods: LoggedFood[] = []
  const kept: string[] = []
  let inList = false
  for (const line of content.split('\n')) {
    const food = parseFoodLine(line, inList)
    if (food) {
      foods.push(food)
      continue
    }
    // "Logged to lunch:" or "Here's what I logged:" opens a list of receipt bullets.
    inList = /\blogged\b.*:\s*$/i.test(line.replace(/\*\*/g, ''))
    if (!(inList && /^\s*(?:\*\*)?logged\b/i.test(line))) kept.push(line)
  }
  return { text: kept.join('\n').replace(/\n{3,}/g, '\n\n').trim(), foods }
}
