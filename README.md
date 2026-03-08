# INFOBASE Web App

Citizen-facing Bangladesh government service knowledge base with guide content, directory listings, and AI-assisted search.

## Prerequisites

- Node.js 20+ and npm 10+
- Supabase project values for frontend environment variables

## Quick Start

```sh
npm install
cp .env.example .env
npm run dev
```

Default dev server: `http://localhost:8080`

## Environment Configuration

Use `.env.example` as the source of required keys.

Required:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Optional:
- `VITE_USE_REMOTE_GUIDES`
- `VITE_GUIDE_DATA_URL`
- `VITE_INDEX_DATA_URL`
- `VITE_ADMIN_PASSWORD` (for local admin workflow overrides only)

Never commit real `.env` values.

## Scripts

- `npm run dev` - start local development server
- `npm run lint` - run ESLint checks
- `npm run test` - run critical automated tests (Vitest)
- `npm run test:watch` - run tests in watch mode
- `npm run build` - generate sitemap and production build
- `npm run preview` - preview production build locally

## Minimum Quality Gate

Before merge/deploy, run:

```sh
npm run lint
npm run test
npm run build
```

## Documentation

- Architecture and data flow: `DOCUMENTATION.md`
- AI safety guardrails: `AGENTS.md`
- Contribution workflow: `CONTRIBUTING.md`
- Security and secret handling: `SECURITY.md`
- Cursor guardrail rules: `.cursor/rules/guardrails.mdc`

## Troubleshooting

- Build fails at sitemap generation: verify `src/data/public_guides_index.json` and `src/data/govDirectory.ts` are valid and present.
- Tests fail after route/content changes: update relevant tests under `src/**/*.test.ts*`.
- Environment-related runtime failures: ensure `.env` is present and required `VITE_` keys are non-empty.
