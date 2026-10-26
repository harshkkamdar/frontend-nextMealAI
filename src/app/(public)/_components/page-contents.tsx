'use client'

import { useEffect, useState } from 'react'

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** "On this page" chips for a long legal page: one per section heading, each jumps to its section. */
export function PageContents() {
  const [sections, setSections] = useState<{ id: string; title: string }[]>([])
  useEffect(() => {
    const headings = [...document.querySelectorAll<HTMLHeadingElement>('main h2, article h2')]
    headings.forEach((h) => { if (!h.id) h.id = slug(h.textContent ?? '') })
    // Read once the content is in the DOM; the list never changes afterwards.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the headings exist only after mount
    setSections(headings.map((h) => ({ id: h.id, title: h.textContent ?? '' })))
  }, [])
  if (sections.length === 0) return null
  return (
    <nav aria-label="On this page" className="scrollbar-hide -mx-5 mb-4 flex gap-1.5 overflow-x-auto px-5 pb-2 pt-0.5">
      {sections.map((s) => (
        <a
          key={s.id}
          data-action
          href={`#${s.id}`}
          className="inline-flex h-11 shrink-0 items-center rounded-full bg-card px-4 text-body-sm font-semibold text-ink shadow-[0_0_0_.5px_rgba(17,28,53,.1)]"
        >
          {s.title}
        </a>
      ))}
    </nav>
  )
}
