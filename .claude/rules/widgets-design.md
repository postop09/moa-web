---
description: widgets 레이어 설계 원칙 — 여러 페이지에서 재사용되는 조합 UI, 세그먼트 구성
globs: widgets/**/*
alwaysApply: false
---

# widgets 설계 원칙

FSD `widgets` 레이어는 **여러 pages에서 재사용되는 조합 UI**를 담는다. 대시보드 셸, 차트 패널 래퍼, KPI 로우처럼 그 자체로는 도메인 데이터를 갖지 않고 **props로 데이터를 주입받아** 레이아웃·로딩/에러/빈 상태를 조립하는 컴포넌트가 대상이다.

```
widgets/
  {slice}/
    ui/         # 조합 UI 컴포넌트
    model/      # widget 자체의 상태/로직 (필요한 경우만)
    lib/        # 순수 유틸 (필요한 경우만)
    config/     # 상수·설정 (필요한 경우만)
    index.ts    # public API
```

대부분의 widget은 `ui/`와 `index.ts`만으로 충분하다. `model`/`lib`/`config`는 해당 widget에 실제로 필요한 로직이 있을 때만 추가한다 (없는데 빈 폴더를 만들지 않는다).

## ui

- 컴포넌트 이름은 슬라이스명과 대응하는 PascalCase (`widgets/chart-panel/ui/ChartPanel.tsx`).
- **도메인 API를 직접 호출하지 않는다.** 데이터는 상위(`pages`)에서 훅으로 조회해 props로 내려받는다. 데이터 조회가 필요하면 `entities`/`features`의 훅을 widget 내부에서 호출하는 대신, 그 훅을 사용하는 쪽(pages)에서 결과를 props로 전달한다.
- 로딩/에러/빈 상태처럼 여러 화면에서 반복되는 상태 UI는 widget이 props(`isLoading`, `isError`, `isEmpty` 등)로 받아 처리한다.

```tsx
// ✅ widgets/chart-panel/ui/ChartPanel.tsx
type Props = {
  title: string;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  children?: ReactNode;
};

export const ChartPanel = ({ title, isLoading, isError, isEmpty, children }: Props) => {
  // ...
};
```

## model / lib / config

- widget 자체의 로컬 상태(예: 열림/닫힘, 탭 선택)나 순수 변환 로직이 있을 때만 사용한다.
- API 호출·TanStack Query 훅은 두지 않는다 — 데이터 페칭은 `features`/`pages`의 책임이다.

## index.ts (public API)

- `ui`의 루트 컴포넌트를 export한다.

```ts
// ✅ widgets/chart-panel/index.ts
export { ChartPanel } from './ui/ChartPanel';
```

## pages vs widgets vs features

| 위치       | 기준                                                             |
| ---------- | ---------------------------------------------------------------- |
| `widgets`  | 여러 페이지에서 재사용되는 **레이아웃/조합 UI** (데이터는 props로 받음) |
| `features` | 여러 화면에서 재사용되는 **비즈니스 로직**(데이터 조회·상태) + 그 UI |
| `pages/{slice}/ui` | 해당 화면에서만 쓰이는 UI                                  |

같은 UI가 pages에만 있다가 다른 페이지에서도 필요해지면 그때 `widgets`(데이터 없는 조합 UI) 또는 `features`(데이터 로직 포함) 중 알맞은 쪽으로 옮긴다.

## 체크리스트

새 widget 추가 시:

1. 실제로 2곳 이상의 페이지에서 쓰이는지 확인한다. 한 화면에서만 쓰면 `pages/{slice}/ui`에 둔다.
2. 도메인 API를 직접 호출하지 않고 props로 데이터를 받도록 설계한다.
3. `ui/`, `index.ts`만으로 충분한지 먼저 검토하고, 필요할 때만 `model`/`lib`/`config`를 추가한다.
4. `index.ts`에 export를 추가한다.
