# moa-web

**모아(Moa)** 는 그래프 중심의 공유 가계부 PWA입니다. 한 가계부를 여러 명이 함께 쓰고, 수입·지출·저축·보험을 기록한 뒤 홈 대시보드에서 소비를 분석하며, 달력에서 일정과 지출을 같이 볼 수 있습니다.

Next.js App Router + Feature-Sliced Design(`src/`) + Supabase 클라이언트입니다.

## Features

- **거래 기록** — 수입·지출·저축·보험, 카테고리·예산, 매달 지정일 반복 거래
- **대시보드** — 잔액, 자산 추이, 카테고리 비율, 주간·월간 지출 차트
- **내역** — 유형·카테고리·월 필터, 합계와 잔액
- **달력** — 일정과 일별 지출을 한 화면에서 관리
- **공유 가계부** — 멤버 초대, 역할(소유자/멤버), 가계부 전환
- **PWA** — 홈 화면에 설치해 앱처럼 사용

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
- `src/pages` — 페이지
- `src/widgets` / `features` / `entities` / `shared`

## Docs

- [프로젝트 상세](docs/overview.md)
- [인증 및 온보딩](docs/authOnboarding.md)
