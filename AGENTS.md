# FIQR frontend agent guide

FIQR uses Next.js 16.1, React 19, TypeScript, Tailwind CSS 4, and Zustand 5.
The Express core API is a separate service.

## Ownership

Respect the path ownership stated in each task brief.
Do not modify files assigned to another lane.
Preserve unrelated work already present in the checkout.
Use `src/components/ui/fiqr` for FIQR design primitives.
Pages are client components unless static export requires a server wrapper.
Access the backend only through modules under `src/lib/api`.

## Design rules

`DESIGN.md` (tokens and components) and `PRODUCT.md` (ethos, Geo) at the repo root are binding; read them first.
Use Archivo as the only product font.
Use ink navy `#111C35`, accent orange `#E8622A`, cream `#FDF6EC`, and card white `#FFFFFF`.
Use `accent-ink` `#BD4A19` for orange text smaller than 19 pt bold.
Reserve macro teal `#3E7C77` for carbs and macro ochre `#A07A3C` for fat.
Do not introduce any other colours.
Allow one orange primary action per screen.
Do not add dark mode or `dark:` classes.
No glass, blur, gradients or decorative shapes; neutral cards are flat with a hairline border.

## Architecture rules

Do not use `next/image`.
Do not add server actions or route handlers.
Do not add dynamic segments without `generateStaticParams`.
Use query parameters for user-specific IDs.
Run lint, type-check, and tests before handing work off.
