# moa-web

Moa 가계부 웹 클라이언트 (Next.js App Router + FSD).

## Stack

- Next.js (App Router) + PWA
- Feature-Sliced Design (`src/`)
- TanStack Query, Zustand, Supabase (`@supabase/ssr`)
- ESLint + Prettier

## Setup

```bash
pnpm install
cp .env.local.example .env.local
# anon key 채우기
pnpm dev
```

## Structure

- `app/` — Next.js 라우트 (thin re-export)
- `src/app` — FSD app (providers, api-routes)
- `src/screens` — 페이지
- `src/widgets` / `features` / `entities` / `shared`
