# 프로젝트 규칙

## 스택
- 프레임워크: Next.js 16 (App Router) + React 19 + TypeScript 5.9
- 라우팅: Next.js App Router (`app/`). `pages/`는 사용하지 않는 빈 디렉터리(README만 존재)이며, react-router는 쓰지 않는다.
- 개발/빌드: `next dev --turbopack`(개발) / `next build --webpack`(빌드) — next-pwa가 webpack 기반이라 빌드만 webpack을 쓴다.
- 스타일: CSS Modules(`*.module.css`) + `src/shared/styles/globals.css`의 CSS 변수(`--color-*`, `--space-*` 등)로 디자인 토큰 관리. Tailwind는 쓰지 않는다.
- 상태 관리: Zustand 5(클라이언트 상태) + TanStack Query 5(서버 상태)
- 차트: ECharts 6 (`echarts/core` + 필요한 모듈만 개별 등록, `echarts-for-react`로 렌더링). 화면마다 쓰는 차트 타입이 다르면 `src/shared/lib/echarts.ts`를 공유하지 말고 화면 전용 등록 모듈을 새로 만든다.
- 백엔드/인증: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- PWA: `@ducanh2912/next-pwa`
- 패키지 매니저: pnpm (`pnpm-lock.yaml`)
- 스키마 검증: 아직 도입하지 않았다 (zod 미사용)
- 테스트: Vitest 5 (`vitest.config.mts`) + `@testing-library/react`/`@testing-library/jest-dom`(컴포넌트·훅 테스트), 환경은 `jsdom`
- 아키텍처: Feature-Sliced Design 폴더 구조는 유지하되, `eslint-plugin-boundaries`는 설치돼 있지 않아 레이어 의존성이 린트로 강제되지 않는다 — 컨벤션으로만 지킨다.

## 명령
- 개발 서버: `pnpm dev`
- 린트: `pnpm lint` (`eslint app src`)
- 포맷: `pnpm format` (적용) / `pnpm format:check` (검사만)
- 빌드: `pnpm build`
- 프로덕션 실행: `pnpm start`
- OG 이미지 생성: `pnpm og:generate`
- 타입체크: 별도 스크립트 없음 — 필요 시 `npx tsc --noEmit`
- 테스트: `pnpm test` (`vitest run`, 1회 실행) / `pnpm test:watch` (`vitest`, watch 모드)

## 테스트 배치
- `src/` 안: 검사 대상 파일 옆에 붙인다. 예) `src/entities/consultation/lib/selectors.test.ts`
- `scripts/` 안: 같은 규칙. 예) `scripts/enrich/rules.test.ts`
- 테스트 파일에서는 같은 슬라이스 내부 파일을 상대 경로로 직접 import해도 된다 (Public API 규칙의 예외).
- `describe`/`it`/`expect`는 전역이 아니다. 반드시 `import { describe, it, expect } from 'vitest'`로 가져온다.
- 컴포넌트·훅 테스트는 `@testing-library/react`의 `render`/`screen`을 쓰고, matcher는 `@testing-library/jest-dom`(전역 setup: `vitest.setup.ts`)을 사용한다. 구현 세부(내부 state, 클래스명)가 아니라 사용자가 보는 결과로 검증한다.
- 테스트 환경은 `jsdom` 전역 적용(`vitest.config.mts`)이라 순수 함수 테스트에도 별도 설정 없이 그대로 쓰면 된다.

## 문서
- 요구사항: `docs/PRD.md`
- 아키텍처: `docs/ARCHITECTURE.md`
- 새 기능 작업 전 위 두 문서를 먼저 읽는다.

## 컨벤션

### 폴더 및 파일 관리

- 슬라이스·폴더명은 **camelCase** (`householdMember/`, `scheduleCategory/`)
- 파일명은 **camelCase** (`createProfile.ts`, `useCreateProfile.ts`)
- ui 컴포넌트 파일명은 **PascalCase** (`HeroSection.tsx`)

### 함수·컴포넌트 작성 규칙

> **신규 코드에만 적용한다.** 기존 코드베이스는 `export function Foo()` 선언식과 `interface Props`/인라인 타입이
> 섞여 있으며, 이번 규칙 도입으로 기존 파일을 일괄 리팩터하지 않는다. 기존 파일을 수정할 때는 그 파일의
> 기존 스타일을 따르고, 새로 추가하는 파일에서만 아래 규칙을 적용한다.

- Hook, 컴포넌트, 유틸 함수 등 신규로 작성하는 **모든 함수**는 **화살표 함수**로 선언합니다.
- 신규로 작성하는 컴포넌트의 Props 타입 이름은 `Props` 를 기본으로 합니다.

```ts
// 화살표 함수 사용
// ✅ Good
export const useCreateProfile = () => {
  // ...
};

export const LoginPage = () => {
  // ...
};

export const createProfile = async (payload: CreateProfileReq) => {
  // ...
};

// default export
const RootLayout = () => {
  // ...
};

export default RootLayout;

// ❌ Bad
export function useCreateProfile() {}
export function LoginPage() {}
export async function createProfile() {}
export default function RootLayout() {}
```

```ts
// Props 타입 선언
// ✅ Good
type Props = {
 // ...
}

export const ProfileActionSection = () => {
  // ...
};

// ❌ Bad
type ProfileActionSectionProps = {
  // ...
}

export const ProfileActionSection = () => {
  // ...
};
```

### FSD 원칙 준수

#### 레이어 의존성 규칙

상위 레이어만 하위 레이어를 import할 수 있습니다. **역방향·동일 레이어 간 직접 참조는 금지**합니다.

```
app → pages → widgets → features → entities → shared
```

| 허용                                      | 금지                 |
| ----------------------------------------- | -------------------- |
| `pages` → `features`, `widgets`, `shared` | `features` → `pages` |
| `app` → `pages`, `features`, `shared`     | `shared` → `features` |
| `widgets` → `features`, `shared`          | `features` → `widgets` |

#### shared 레이어

도메인에 속하지 않는 **범용 코드**만 둔다. 특정 기능·화면 로직은 shared에 두지 않는다.

| 세그먼트         | 내용                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `shared/api`     | API 클라이언트, 공통 요청 유틸 (인증 토큰 저장, 쿼리스트링 변환 등)                       |
| `shared/config`  | 환경변수, 전역 상수                                                                       |
| `shared/lib`     | 도메인 무관 순수 유틸. 연관 유틸이 많으면 하위 폴더로 묶는다 (예: `shared/lib/charts/`)   |
| `shared/ui`      | 범용 UI 컴포넌트 (`Button`, `EmptyState` 등). 루트 `index.ts`에서 export                 |

```ts
// ✅ shared/ui/index.ts
export { Button } from './Button';
export { EmptyState } from './EmptyState';
```

#### Public API

- 슬라이스 외부에서는 **반드시 슬라이스 루트 `index.ts`** 를 통해 import합니다.
- 내부 파일(`ui/`, `model/` 등)을 직접 import하지 않습니다.

```ts
// ✅ Good
import { useGetCategories } from '@/features/category';

// ❌ Bad
import { useGetCategories } from '@/features/category/model/useGetCategories';
```

**보조 진입점 예외**: 서버 전용 코드를 클라이언트 번들에서 분리해야 할 때는 슬라이스 루트에 `server.ts`를 두고 그것만 export하는 두 번째 진입점을 허용한다 (예: `shared/api/server.ts`, `features/onboarding/server.ts`). 화면마다 다른 등록이 필요한 라이브러리 초기화 모듈(예: `shared/lib/echarts.ts`)도 같은 이유로 `index.ts`를 거치지 않고 직접 import할 수 있다. 그 밖의 내부 파일 직접 import는 예외가 아니다.

---

# 프론트엔드 기능 개발 워크플로우

새 기능이나 변경 요구가 들어오면 메인 세션은 아래 순서를 따른다.
코드를 실제로 변경하는 에이전트는 `test-writer`(테스트 파일만)와 `frontend-dev`(구현 코드만) 둘뿐이다.
리뷰어는 코드를 수정하지 않으며 리포트만 낸다.

## 1. 계획 (메인, plan mode)
- `docs/PRD.md`에서 해당 요구사항을 찾는다. 없으면 사용자에게 먼저 요구사항을 문서화하도록 요청한다.
- 작업을 기능 단위로 분해하고, 각 단위에 대해 "테스트 선행 대상"과 "시각 요소(테스트 생략 가능)"를 구분한다.
- 공개 페이지 여부를 판단한다(SEO 리뷰 필요 여부).
- 계획을 사용자에게 보여 승인을 받는다.

## 2. 테스트 작성 → `test-writer`
- 기능 단위 하나씩 위임한다. 요구사항 원문과 대상 파일 위치를 전달한다.
- 결과 보고에서 "가정한 부분"이 있으면 사용자에게 확인한다.

## 3. 구현 → `frontend-dev`
- 대상 테스트 파일 경로와 요구사항을 전달한다.
- "테스트가 잘못됐다"는 보고가 오면 dev가 고치게 하지 말고 사용자에게 판단을 요청한 뒤, 필요하면 `test-writer`에게 수정을 위임한다.

## 4. 리뷰 → 리뷰어들을 병렬로 실행
- 항상: `code-reviewer`, `a11y-reviewer`, `ux-reviewer`
- 공개 페이지 변경 시에만: `seo-perf-reviewer`
- 각 리뷰어에게 변경 범위(파일 목록 또는 "git diff 기준")와 요구사항 위치를 전달한다.

## 5. 리포트 취합 → 수정 → `frontend-dev`
- 리포트를 심각도별로 합친다. 서로 충돌하는 제안이 있으면 사용자에게 결정을 요청한다.
- `Critical`과 `Warning`을 `frontend-dev`에게 전달해 반영시킨다. `Suggestion`은 사용자에게 보여주고 반영 여부를 묻는다.
- 수정 후 테스트를 다시 실행해 통과를 확인한다. Critical이 있었다면 해당 리뷰어를 한 번 더 돌려 해소됐는지 확인한다.
- 작업 후 `docs/PRD.md`, `docs/ARCHITECTURE.md` 를 최신화한다.

## 6. 커밋
- 테스트·린트·타입체크 통과 확인 후 기능 단위로 커밋한다.

## 원칙
- 한 번에 한 기능 단위만 진행한다. 여러 기능을 동시에 test → dev로 흘리지 않는다.
- 리뷰어 리포트는 그대로 dev에게 넘기지 말고, 메인이 취합·중복 제거한 뒤 넘긴다.
- 사용자 승인이 필요한 지점: 계획, 테스트 수정, 충돌하는 리뷰 제안, Suggestion 반영.