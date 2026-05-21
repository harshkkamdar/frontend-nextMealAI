/**
 * FB-R6-11 FE · "meal plan" → "nutrition plan" copy sweep
 *
 * Walks src/ for the literal phrase "meal plan" (case-insensitive, space-
 * separated). Hyphenated identifiers like `meal-plan-builder.tsx` and
 * camelCase like `mealPlan` are deliberately NOT matched — the sweep targets
 * user-facing English prose only.
 *
 * Allowlist: contexts that may legitimately still contain "meal plan":
 *   - This test file itself
 *   - Test-fixture files that assert old behavior (none expected this round)
 *
 * Comments and JSDoc are NOT exempt — if a comment uses "meal plan" as the
 * feature name, it should be renamed too for consistency.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..')
const SRC_DIR = path.join(REPO_ROOT, 'src')

const TARGET = /meal plan/i // case-insensitive, literal " " separator

const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'build'])
const ALLOWLIST_RELATIVE = new Set<string>([
  // self
  'src/__tests__/copy/nutrition-plan-rename.test.ts',
])

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    let stat
    try {
      stat = statSync(full)
    } catch {
      continue
    }
    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue
      walk(full, acc)
    } else if (/\.(tsx?|jsx?|mts|cts)$/.test(entry)) {
      acc.push(full)
    }
  }
  return acc
}

interface Violation {
  file: string
  line: number
  text: string
}

describe('FB-R6-11 FE · "meal plan" → "nutrition plan" sweep', () => {
  it('FE-R6-11-FE-AC01/AC02: no user-facing "meal plan" strings remain in src/', () => {
    const files = walk(SRC_DIR)
    const violations: Violation[] = []

    for (const file of files) {
      const rel = path.relative(REPO_ROOT, file)
      if (ALLOWLIST_RELATIVE.has(rel)) continue

      const content = readFileSync(file, 'utf8')
      const lines = content.split('\n')
      lines.forEach((line, idx) => {
        if (TARGET.test(line)) {
          violations.push({ file: rel, line: idx + 1, text: line.trim() })
        }
      })
    }

    if (violations.length > 0) {
      const msg = violations
        .map((v) => `  ${v.file}:${v.line}  ${v.text}`)
        .join('\n')
      throw new Error(
        `Found ${violations.length} user-facing "meal plan" occurrences (should be "nutrition plan"):\n${msg}`
      )
    }

    expect(violations).toHaveLength(0)
  })
})
