import { cn } from '@/lib/utils'

/** The backend's password rules (core validators/auth.validators.ts passwordSchema), checked before the request. */
export const PASSWORD_RULES = [
  { label: 'At least 8 characters', met: (p: string) => p.length >= 8 },
  { label: 'An uppercase letter', met: (p: string) => /[A-Z]/.test(p) },
  { label: 'A lowercase letter', met: (p: string) => /[a-z]/.test(p) },
  { label: 'A number', met: (p: string) => /[0-9]/.test(p) },
  { label: 'A symbol, like ! or #', met: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export const passwordOk = (password: string) => PASSWORD_RULES.every((rule) => rule.met(password))

/** Each rule ticks as it is met, so the password is right before the button, not after a refusal. */
export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="mt-2 flex flex-col gap-1.5" aria-label="Password needs">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.met(password)
        return (
          <li key={rule.label} className="flex items-center gap-2 text-[14.5px] font-medium text-ink-65">
            <span aria-hidden="true" className={cn('grid size-[18px] place-items-center rounded-full border-[1.5px] transition-colors duration-200', met ? 'border-ink bg-ink text-cream' : 'border-ink-35')}>
              {met ? <svg viewBox="0 0 16 16" className="pop size-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg> : null}
            </span>
            {rule.label}<span className="sr-only">{met ? ', done' : ''}</span>
          </li>
        )
      })}
    </ul>
  )
}
