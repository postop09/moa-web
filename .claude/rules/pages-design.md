---
paths: src/pages/**/*
---

# pages 설계 원칙

FSD `pages` 레이어는 **도메인 단위 슬라이스**로 구성한다. 각 슬라이스는 목적에 따라 세그먼트를 구성한다.

```
pages/
  {slice}/
    ui/         # 슬라이스 전용 UI 컴포넌트
    model/      # 훅, 스토어, 화면 전용 비즈니스 로직
    api/        # entities api를 조합하는 화면 전용 api
    lib/        # mock, mapper, 순수 유틸
    config/     # 상수·설정
    index.ts    # public API — ui/{Domain}Page를 re-export만 함
```

## ui

- 해당 슬라이스 전용 UI 컴포넌트.
- **`{Domain}Page` 컴포넌트도 이 세그먼트에 둔다** (`ui/{Domain}Page.tsx`) — 섹션들을 조립해 실제 페이지를 구성하는 루트 컴포넌트. `index.ts`는 이를 re-export만 한다.
- 최소 기능 단위로 컴포넌트를 분리한다.
- 섹션별 레이아웃·스타일은 해당 컴포넌트에 둔다.
- 슬라이스 내부에서는 `ui/`·`model/` 등 상대 경로 import를 허용한다.

```tsx
// ✅ ui/GoogleSignInButton.tsx — model 훅 사용
import { useSignInWithGoogle } from '../model/useSignInWithGoogle';
```

## model

- 화면 전용 훅, 스토어, 비즈니스 로직.
- Hook 파일명은 **camelCase** (`useSignInWithGoogle.ts`).
- API 호출은 `entities`를 import한다. `entities` 로직을 model에 복제하지 않는다.

```typescript
// ✅ model/useSignInWithGoogle.ts
import { signInWithGoogle } from '@/entities/auth';

export const useSignInWithGoogle = () => {
  return useMutation({ mutationFn: signInWithGoogle, ... });
}
```

## api

- `entities`에 선언된 api를 활용·조합하는 해당 슬라이스 전용 api.
- 단순히 `entities` 함수를 그대로 호출만 한다면 `api` 세그먼트를 만들지 않고 `model` 훅에서 직접 사용한다.

## lib

- mock 데이터, mapper, 로컬 캐시, 비즈니스 없는 유틸.

## config

- 슬라이스 전용 env 키, 테이블명, 쿼리 키, 상수 등.

## index.ts (public API)

- 실제 페이지 조립은 `ui/{Domain}Page.tsx`에서 하고, `index.ts`는 그것을 **re-export만** 한다.
- 파일명은 `index.ts` (JSX가 없으므로 `.tsx`가 아니다).
- export 이름은 `{Domain}Page` (`CsPage`).

```tsx
// ✅ pages/cs/ui/CsPage.tsx — 섹션 조립
import { PageTitle } from '@/shared/ui';
import { CsDiagnosticBand } from './CsDiagnosticBand';
import { MonthlyDiagnosticPanel } from './MonthlyDiagnosticPanel';

export const CsPage = () => {
  return (
    <div className="space-y-4">
      <PageTitle title="CS" />
      <CsDiagnosticBand />
      <MonthlyDiagnosticPanel />
    </div>
  );
};
```

```ts
// ✅ pages/cs/index.ts — public API
export { CsPage } from './ui/CsPage';
```

## features vs pages

| 위치                 | 기준                                        |
| -------------------- | ------------------------------------------- |
| `features`           | 여러 화면·위젯에서 재사용되는 비즈니스 기능 |
| `pages/{slice}/ui`   | 해당 화면에서만 쓰이는 UI·인터랙션          |

```text
// login 화면 전용 → pages/login/ui/GoogleSignInButton.tsx
// 여러 탭·화면에서 쓰임 → features/{feature}/ui/...
```

## 체크리스트

1. `shared`에서 공통으로 쓸 수 있는 요소가 있는지 먼저 확인.
2. 해당 슬라이스 UI·로직은 해당 `pages/{slice}`에 둔다.
3. `ui/{Domain}Page.tsx`에서 섹션을 조립하고, `index.ts`가 이를 re-export.
4. 다른 슬라이스에 재사용되는 요소는 `shared` 또는 `features`로 이동.
5. API 원본은 `entities`에 두고, 활용은 `model` 훅으로 감싸서 사용한다.
