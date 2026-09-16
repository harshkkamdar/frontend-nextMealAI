# FIQR frontend

FIQR is a mobile-first nutrition and training coach.
Geo is the in-product coaching agent.
This repository contains the FIQR web and native-shell frontend.

## Stack

- Next.js 16.1, React 19, and TypeScript
- Tailwind CSS 4 and shadcn-compatible UI primitives
- Zustand 5 stores
- Vitest and Testing Library

## Local development

Install dependencies with `npm install`.
Start the development server with `npm run dev`.
The app runs at `http://localhost:3010`.

## Environment

Copy `.env.local.example` to `.env.local`.
Set `NEXT_PUBLIC_CORE_API_URL` to the absolute core API origin.
Set `NEXT_PUBLIC_TARGET=capacitor` only for native static exports.

## Build modes

`npm run build` creates the normal Next.js web build.
The web build includes legacy route redirects.
`NEXT_PUBLIC_TARGET=capacitor npm run build` creates a static export.
Static output is written to `out/` with trailing slashes enabled.

## Quality checks

Run `npm run lint` for ESLint.
Run `npm run type-check` for TypeScript.
Run `npm test` for the full Vitest suite.

## Design reference
The source design reference lives in `../FIQR/`.
