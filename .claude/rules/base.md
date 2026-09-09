---
alwaysApply: true
---

# 공통

## 관련 문서

이 문서(`base.md`)는 항상 적용된다. 나머지 규칙 문서는 작업 경로·상황에 따라 적용된다.

- `entities-design.md` — `src/entities/**` 작업 시
- `features-design.md` — `src/features/**` 작업 시
- `pages-design.md` — `src/pages/**` 작업 시
- `widgets-design.md` — `src/widgets/**` 작업 시
- `git-convention.md` — 커밋 메시지 작성 시 (항상 적용)
- `agents-design.md` — `.claude/agents/`, `.claude/skills/` 작성 시

## 폴더 및 파일 관리

- 모든 파일 및 폴더명은 **camelCase** (`createProfile.ts`, `/addTransaction`)
- ui 컴포넌트 파일명은 **PascalCase** (`HeroSection.tsx`)

## 함수·컴포넌트 작성 규칙

- Hook, 컴포넌트, 유틸 함수 등 **모든 함수**는 **화살표 함수**로 선언합니다.
- 컴포넌트의 Props 타입 이름은 `Props` 를 기본으로 합니다.

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

## FSD 원칙

### 레이어 의존성 규칙

상위 레이어만 하위 레이어를 import할 수 있습니다. **역방향·동일 레이어 간 직접 참조는 금지**합니다.

```
app → pages → widgets → features → entities → shared
```

| 허용                                      | 금지                 |
| ----------------------------------------- | -------------------- |
| `pages` → `features`, `widgets`, `shared` | `features` → `pages` |
| `app` → `pages`, `features`, `shared`     | `shared` → `features` |
| `widgets` → `features`, `shared`          | `features` → `widgets` |

### shared 레이어

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

### Public API

- 슬라이스 외부에서는 **반드시 슬라이스 루트 `index.ts`** 를 통해 import합니다.
- 내부 파일(`ui/`, `model/` 등)을 직접 import하지 않습니다.

```ts
// ✅ Good
import { useGetCategories } from '@/features/category';

// ❌ Bad
import { useGetCategories } from '@/features/category/model/useGetCategories';
```

### `app/` 레이어 역할 분리

이 프로젝트는 Next.js App Router(파일 기반 라우팅)를 사용합니다. `app/`은 라우팅·메타데이터 설정만 담당하고, 실제 페이지 UI 및 로직은 `src/pages/`에 둡니다.

`app/{route}/page.tsx`(또는 라우트 그룹 `app/({group})/{route}/page.tsx`)는 `metadata`만 선언하고 `src/pages/{slice}`의 페이지 컴포넌트를 얇게 re-export합니다.

```tsx
// ✅ app/(marketing)/welcome/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '그래프로 보는 가계부',
};

export { WelcomePage as default } from '@/pages/welcome';
```
