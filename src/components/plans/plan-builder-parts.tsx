/** The validation messages that belong to one builder step (validate() returns them for the whole plan). */
export function stepErrors(step: 'name' | 'targets' | 'days', errors: string[]): string[] {
  const isName = (e: string) => e.startsWith('Plan name')
  const isTarget = (e: string) => / target /.test(` ${e} `)
  if (step === 'name') return errors.filter(isName)
  if (step === 'targets') return errors.filter(isTarget)
  return errors.filter((e) => !isName(e) && !isTarget(e))
}
