# 개선 과제

2026-09-14 코드베이스 전수 감사 결과. 우선순위는 **사용자에게 잘못된 데이터가 보이는가 → 장애 시 복구 가능한가 → 유지보수 비용** 순으로 매겼다.

각 항목은 `근거(파일:라인)` → `문제` → `제안` 순으로 쓴다. 모든 수치는 이 세션에서 grep/직독으로 확인한 것이다.

검증 방법: `pnpm test`(0 파일, exit 1), `pnpm lint` / `npx tsc --noEmit`(0 에러), 전수 `grep`, `supabase/migrations/*.sql` 직독, `git log` / `git ls-files`.

관련 문서: [제품 요구사항](./PRD.md) · [아키텍처](./ARCHITECTURE.md) · [인증 및 온보딩](./authOnboarding.md)

---

## 요약

| #   | 항목                                                       | 영역      | 우선순위 | 상태          |
| --- | ---------------------------------------------------------- | --------- | -------- | ------------- |
| 1   | 기본 스키마·RLS·RPC가 저장소에 없음                        | DB        | 🔴 높음  | -             |
| 2   | 삭제한 반복 거래가 다음 날 다시 생성됨                     | DB        | 🔴 높음  | -             |
| 3   | 반복 거래 배치가 매일 전체 과거를 재순회                   | DB        | 🔴 높음  | -             |
| 4   | Supabase 클라이언트가 untyped, api 레이어가 검증 없는 단언 | 타입      | 🔴 높음  | -             |
| 5   | 홈 대시보드가 12개월 거래 전량을 클라이언트로 내려받음     | 데이터    | 🔴 높음  | -             |
| 6   | 앱 라우트에 서버 측 인증 검증이 없음                       | 보안      | 🔴 높음  | -             |
| 7   | QueryClient `retry` 미설정, 전역 에러 핸들러 없음          | 데이터    | 🟠 중간  | -             |
| 8   | 거래·일정 queryKey가 파라미터를 일부만 반영                | 데이터    | 🟠 중간  | -             |
| 9   | 하드코딩된 queryKey 2곳                                    | 데이터    | 🟠 중간  | -             |
| 10  | env 검증 부재 + README가 없는 파일을 안내                  | 안정성/DX | 🟠 중간  | -             |
| 11  | 테스트 0개, CI 없음                                        | 품질      | 🟠 중간  | ✅ 완료       |
| 12  | loading.tsx/Suspense/ErrorBoundary 전무                    | 안정성    | 🟠 중간  | -             |
| 13  | 한국어 앱인데 폰트 3종 모두 latin 서브셋만 로드            | 성능      | 🟠 중간  | -             |
| 14  | 디자인 시스템 부재 (버튼 클래스 103개 중복 등)             | 구조      | 🟠 중간  | -             |
| 15  | 컨벤션 문서 충돌·드리프트                                  | 구조      | 🟡 낮음  | ✅ 완료       |
| 16  | Public API deep import 17건                                | 구조      | 🟡 낮음  | ✅ 완료       |
| 17  | widgets 설계 규칙 위반 2건                                 | 구조      | 🟡 낮음  | ✅ 완료(대안) |
| 18  | 로딩/에러 문구에 aria-live·role="alert" 누락               | 접근성    | 🟡 낮음  | 🟡 부분 완료  |
| 19  | 캐시·상태 관리 세부 개선점                                 | 구조      | 🟡 낮음  | 🟡 부분 완료  |
| 20  | 에러 타입 부재, 뮤테이션 onError 0건                       | 안정성    | 🟡 낮음  | 🟡 부분 완료  |
| 21  | 기타 정리 항목                                             | 정리      | 🟡 낮음  | 🟡 부분 완료  |

---

## 🔴 높음 — 데이터·보안

### 1. 기본 스키마·RLS·RPC가 저장소에 없음

**근거** — `supabase/migrations/`에는 반복 거래 관련 파일 3개뿐이다. `transactions`/`households`/`profiles`/`categories`/`schedules`/`household-members`/`household-invites`/`schedule-categories` 8개 테이블의 `CREATE TABLE`이 없고, RPC `accept_household_invite`([`src/entities/householdInvite/api/acceptHouseholdInvite.ts`](../src/entities/householdInvite/api/acceptHouseholdInvite.ts)에서 호출)의 정의도 없다. `grep -ri "row level security\|create policy" supabase/migrations` 결과 0건. `supabase/config.toml`, seed 파일도 없다.

**문제** — 새 Supabase 프로젝트로 환경을 재현할 수 없다. 더 중요한 것은, 클라이언트가 publishable 키로 `.from('transactions').eq('householdId', ...)`를 직접 호출하는 구조([`src/entities/transaction/api/listTransactions.ts`](../src/entities/transaction/api/listTransactions.ts))라 **RLS가 다른 가계부 데이터를 못 보게 하는 유일한 방어선**인데, 그 정책이 코드 리뷰·버전 관리 대상 밖에 있다.

**제안** — `supabase db pull`로 현재 스키마 + 정책을 베이스라인 마이그레이션으로 덤프해 커밋한다. 이후 스키마 변경은 마이그레이션 파일로만 진행한다. 각 테이블의 정책을 [ARCHITECTURE.md](./ARCHITECTURE.md)에도 표로 남긴다.

### 2. 삭제한 반복 거래가 다음 날 다시 생성됨

**근거** — [`supabase/migrations/20260902150100_add_generate_recurring_transactions_function.sql`](../supabase/migrations/20260902150100_add_generate_recurring_transactions_function.sql):

```sql
IF NOT EXISTS (
  SELECT 1 FROM transactions child
  WHERE child."recurringSourceId" = template.id
    AND date_trunc('month', child."transactionDt" AT TIME ZONE 'Asia/Seoul')
      = date_trunc('month', month_cursor)
) THEN
  INSERT INTO transactions (...)
```

**문제** — 중복 방지가 "그 달에 해당 사본 행이 존재하는가"로만 판정된다. 사용자가 자동 생성된 거래를 삭제하면 행이 사라지므로, 다음 날 00:05 cron이 같은 거래를 다시 만든다. 사용자 입장에서는 지운 지출이 되살아나는 버그로 보인다.

**제안** — 생성 이력을 행의 존재와 분리한다.

- `recurring_generation_log(templateId, month)` 별도 이력 테이블에 UNIQUE 제약을 두고 INSERT 여부를 이력 기준으로 판정
- 또는 템플릿에 `lastGeneratedMonth` 컬럼을 두어 그 이후 달만 생성
- 기존 `transactions_recurring_source_month_unique` 인덱스를 살려 `INSERT ... ON CONFLICT DO NOTHING`으로 바꾸면 `NOT EXISTS` 서브쿼리도 함께 제거 가능

### 3. 반복 거래 배치가 매일 전체 과거를 재순회

**근거** — 같은 파일의 이중 루프:

```sql
FOR template IN SELECT * FROM transactions WHERE "isRecurring" = true ... LOOP
  month_cursor := start_month;              -- 템플릿 생성 다음 달
  WHILE month_cursor <= end_month LOOP      -- 이번 달까지
```

**문제** — 매일 실행될 때마다 모든 템플릿에 대해 생성 시점부터 이번 달까지 전체 개월을 다시 순회하며 매달 `NOT EXISTS` 서브쿼리를 돌린다. 비용이 `템플릿 수 × 누적 개월 수`로 계속 커지고, 서비스를 오래 쓸수록 단조 증가한다. 템플릿 조회 조건(`"isRecurring" = true AND "recurringDay" IS NOT NULL AND "recurringSourceId" IS NULL`)에 인덱스가 없어 매일 `transactions` 풀스캔이 발생한다(마이그레이션의 유일한 인덱스는 자식 행 dedup용 `transactions_recurring_source_month_unique`뿐).

**제안**

- 평상시 실행은 이번 달만 처리하도록 범위를 좁히고, 과거 보정은 파라미터를 받는 별도 함수로 분리
- `WHERE "isRecurring" = true AND "recurringSourceId" IS NULL`에 맞는 부분 인덱스 추가
- `RAISE LOG`로 처리 건수를 남겨 배치 실패를 관측 가능하게

### 4. Supabase 클라이언트가 untyped, api 레이어가 검증 없는 단언

**근거** — [`src/shared/api/index.ts:2`](../src/shared/api/index.ts):

```ts
export type { SupabaseClient } from '@supabase/supabase-js';
```

제네릭 `Database` 인자 없이 재수출한다. `grep -rn "Database" src` 결과 0건, `database.types.ts` 없음.

**문제** — `strict: true`인데도 Supabase 응답이 사실상 검증되지 않는다. entities api 35개 파일 전부가 `select('*')`의 `any` 결과를 손으로 적은 `Res` 타입으로 캐스팅한다. 실제로 컬럼 규약이 혼재하는 것도 이 때문에 드러나지 않는다 — [`src/entities/category/api/listCategories.ts:14`](../src/entities/category/api/listCategories.ts)는 `.order('created_at')`(snake_case)를 쓰는데 `transactions`는 `"transactionDt"`(camelCase)다. 컬럼명 오타나 스키마 변경이 런타임까지 살아서 간다.

**제안**

```bash
supabase gen types typescript --project-id <id> > src/shared/api/database.types.ts
```

후 `SupabaseClient<Database>`로 좁히고, entities의 수기 타입을 `Tables<'transactions'>` 파생으로 교체한다. 타입 생성을 CI(#11)에 넣어 드리프트를 방지한다.

### 5. 홈 대시보드가 12개월 거래 전량을 클라이언트로 내려받음

**근거** — [`src/pages/home/model/useHomeDashboard.ts`](../src/pages/home/model/useHomeDashboard.ts)가 `YEAR_WINDOW = 12` 범위를 `limit` 없이 요청하고, [`useListTransactions`](../src/features/transaction/model/useListTransactions.ts)는 `type`/`categoryId`/`limit`/`offset`을 받을 수 있음에도([`ListTransactionsReq`](../src/entities/transaction/model/listTransactionsReq.ts)) 넘기지 않아 [`listTransactions.ts`](../src/entities/transaction/api/listTransactions.ts)의 `.range()` 분기를 타지 않는다. 5개 집계 함수(`buildMonthlyExpenses` 등)가 전부 브라우저 `useMemo`에서 돈다.

**문제** — Supabase PostgREST의 기본 응답 행 수 제한(통상 1000, 프로젝트 실제 설정값은 미확인)에 걸리면 **에러 없이 잘린 배열**이 돌아오고, 대시보드 합계가 조용히 틀린 값을 정상처럼 보여준다. 이 경로는 `{ count: 'exact' }`도 요청하지 않아 절단 여부를 감지할 수단이 없다. 또 여러 명이 오래 쓴 가계부에서는 12개월치 전 행을 매번 내려받아 브라우저에서 집계하는 구조가 전송량·파싱 비용 면에서 계속 나빠진다.

**제안**

- 단기: 이 경로도 `{ count: 'exact' }`를 요청해 절단 여부를 로그로 감지
- 중기: 대시보드 집계를 Postgres RPC(월별 유형 합계, 카테고리별 합계)로 내리고 클라이언트는 집계 결과만 받는다 — `buildMonthlyExpenses`/`buildDailyExpenses`/`buildExpenseByCategory`/`buildCategoryBudgets`/`buildWeeklyExpenses`가 대상

### 6. 앱 라우트에 서버 측 인증 검증이 없음

**근거** — [`app/(app)/layout.tsx`](<../app/(app)/layout.tsx>)는 `<AppShell>`만 렌더한다. 보호 페이지(`/`, `/history`, `/calendar`, `/settings`, `/write`)는 전부 클라이언트 컴포넌트를 재수출만 하는 서버 파일이다(예: `app/(app)/page.tsx`가 `export { HomePage as default } from '@/pages/home'`). 반면 `(auth)` 그룹은 서버에서 `resolveAuthGate()`를 직접 호출해 검증한다([`app/(auth)/login/page.tsx`](<../app/(auth)/login/page.tsx>) 등) — 그룹 간 일관성이 없다.

**문제** — `(app)` 그룹의 유일한 인증 게이트가 `proxy.ts` 미들웨어 하나다. 이는 [`authOnboarding.md`](./authOnboarding.md)에 명시적으로 문서화된 의도된 설계이지만, Next.js 공식 권장(미들웨어는 "optimistic check"이며 실제 보호는 데이터 레이어/페이지에서)과 어긋난다. 더해 `proxy.ts`의 matcher가 경로 열거식이라([`proxy.ts`](../proxy.ts)) `(app)`에 새 보호 라우트를 추가하며 matcher 갱신을 잊으면 그 라우트는 인증 없이 노출된다. 실제로 `PUBLIC_PATHS`의 `/privacy`·`/terms`는 matcher에 없어 해당 분기가 이미 도달 불가 상태다.

**제안** — 완화 요인은 있다(RLS가 최종 방어선이 될 수 있음 — 단 #1처럼 RLS 자체가 저장소에 없어 검증 불가; Next 16은 미들웨어 우회 CVE 패치 버전). 그래도 `app/(app)/layout.tsx`에서 `resolveAuthGate()` 한 번을 호출하거나 최소 `getUser()` 확인을 넣는 것이 정석이다. matcher는 정적 자산만 제외하는 negative lookahead로 뒤집고 코드 내부에서 public 경로를 판정하는 편이 새 라우트 누락 위험을 없앤다.

---

## 🟠 중간 — 데이터·품질·성능

### 7. QueryClient `retry` 미설정, 전역 에러 핸들러 없음

**근거** — [`src/shared/lib/queryClient.ts:6-14`](../src/shared/lib/queryClient.ts) 전부:

```ts
defaultOptions: {
  queries: {
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  },
},
```

**문제** — `retry` 미설정이라 기본값 3회가 적용된다. Supabase의 RLS 거부(401/403)나 PostgrestError도 3번 재시도돼 실패 UI가 늦게 뜨고 불필요한 요청이 3배 발생한다. `mutations` 기본값, `QueryCache`/`MutationCache`의 전역 `onError`도 없어 에러 로깅·리포팅 경로가 전역에 하나도 없다. `HydrationBoundary`/서버 prefetch를 쓰지 않아 `getQueryClient()`의 서버 분기([`src/shared/lib/queryClient.ts:16-19`](../src/shared/lib/queryClient.ts))는 현재 쓰이지 않는 코드다.

**제안** — 4xx는 재시도하지 않는 `retry` 함수를 정의하고, `QueryCache`의 `onError`에서 최소한 콘솔/추후 Sentry 연동 지점을 만든다.

### 8. 거래·일정 queryKey가 파라미터를 일부만 반영

**근거** — [`ListTransactionsReq`](../src/entities/transaction/model/listTransactionsReq.ts)에는 `type`/`categoryId`/`limit`/`offset`이 있으나 [`useListTransactions.ts:19`](../src/features/transaction/model/useListTransactions.ts)의 키는 `householdId/from/to`만 담는다.

**문제** — 현재 호출부 2곳([`useHomeDashboard.ts`](../src/pages/home/model/useHomeDashboard.ts), [`useCalendarPage.ts`](../src/pages/calendar/model/useCalendarPage.ts))이 우연히 그 3개만 넘겨서 사고가 나지 않을 뿐이다. 누군가 `type`을 넘기는 순간 다른 필터 결과가 같은 캐시 엔트리를 덮어쓴다. [`useListSchedules.ts:16`](../src/features/schedule/model/useListSchedules.ts)도 동일 구조.

**제안** — 훅 시그니처를 실제 사용하는 파라미터로 좁히거나(`Pick<>`), 키에 전체 파라미터를 포함시킨다.

### 9. 하드코딩된 queryKey 2곳

**근거** — [`useLeaveHousehold.ts:19`](../src/features/householdMember/model/useLeaveHousehold.ts), [`useAcceptHouseholdInvite.ts:19`](../src/features/householdMember/model/useAcceptHouseholdInvite.ts)가 `queryClient.invalidateQueries({ queryKey: ['households'] })`로 직접 쓴다. 팩토리 `householdQueryKeys.all`([`src/features/household/config/queryKeys.ts`](../src/features/household/config/queryKeys.ts))이 있는데 우회한다.

**문제** — `household` 피처를 import하면 순환 참조가 생길까 봐 피한 것으로 보이지만, 팩토리와 실제 키가 어긋나면 무효화가 조용히 실패한다.

**제안** — queryKey 팩토리를 `entities/household/config`로 옮기면(이미 `entities/auth/config/queryKeys.ts` 선례가 있음) `features/householdMember`가 순환 없이 import할 수 있다.

### 10. env 검증 부재 + README가 없는 파일을 안내

**근거** — [`createBrowserClient.ts:5-6`](../src/shared/api/createBrowserClient.ts), [`createServerClient.ts:8-9`](../src/shared/api/createServerClient.ts), [`proxy.ts:48-49`](../proxy.ts) 모두 `process.env.NEXT_PUBLIC_SUPABASE_URL!` 형태(non-null 단언 6건, 동일 문자열 3쌍 중복). `README.md:27`은 `cp .env.local.example .env.local`을 안내하지만 `.env.local.example` 파일이 저장소에 없다(`git ls-files`에도 없음). 실제 로컬 파일명도 `.env.local`이 아니라 `.env`다.

**문제** — env 값이 비면 타입 검사는 통과하고 런타임에서야 터진다. 특히 `proxy.ts`에서 터지면 모든 요청이 실패한다. 신규 기여자는 README를 따라도 막힌다.

**제안** — `src/shared/config/env.ts`에서 앱 시작 시 한 번 검증하고(간단한 수기 검사로 충분), 세 곳이 함께 임포트한다. `.env.example`을 추가하고 README를 실제 파일명(`.env`)에 맞게 고친다.

### 11. 테스트 0개, CI 없음

> **진행 상황 (✅ 완료)** — `typecheck` 스크립트를 추가하고, `lint`/`format`/`format:check` 대상을 `proxy.ts`·`scripts/`·`next.config.ts`·설정 파일까지 넓혔다(새로 뜬 에러 0건). 아래 표의 함수 전부에 특성화 테스트를 추가했다(`getErrorCode`/`mapInviteError`는 #20/#18 작업 중 이미 커버돼 제외). `.github/workflows/ci.yml`을 신설해 PR·main push마다 `lint`/`format:check`/`typecheck`/`test`(`verify` 잡)와 `pnpm build`(`build` 잡, 병렬)를 돌린다. `vitest.config.mts`에 `test.env.TZ = 'Asia/Seoul'`을 고정했다 — `buildDailyExpenses`/`buildWeeklyExpenses`/`buildEventLanes`/`visibleRange`가 로컬 타임존 기준으로 날짜 경계를 계산해, UTC가 기본인 GitHub Actions 러너에서만 깨질 수 있었다(`TZ=UTC pnpm test`로 고정 전/후 차이를 확인). 이 작업 중 아래 문서 초안의 사실 오류도 함께 바로잡았다: "버튼 클래스 103개"는 `:hover`/`:disabled`까지 포함한 셀렉터 줄 수였고 실제 중복 정의는 5개 파일뿐이며(#14), `parseDayKey('')`는 `Number('')===0`이 아니라 `month`/`day`가 `undefined`가 돼 실제로는 `null`을 반환한다(테스트로 고정).
>
> 테스트 작성 중 드러난, 이번 범위 밖의 작은 동작 두 가지는 고치지 않고 현재 동작 그대로 특성화 테스트로 고정했다 — 후속 과제로 남긴다: (1) `buildCategoryBudgets`의 정렬 비교자는 두 카테고리의 `ratio`가 모두 `Infinity`면 `Infinity - Infinity = NaN`이 돼 그 둘 사이 순서가 미정의다. (2) `buildExpenseByCategory`는 카테고리가 16개를 넘으면 상위 15개만 반환하고 나머지를 조용히 버린다(주석 처리된 "기타" 버킷 코드가 남아 있어, 원래는 합산할 계획이었던 것으로 보인다).

**근거** — `find app src scripts -name '*.test.*' -o -name '*.spec.*'` 결과 0건. `pnpm test`는 "No test files found"로 exit 1. `.github/` 디렉터리 없음, husky/lint-staged 없음. `package.json`에 `typecheck` 스크립트 없음(`npx tsc --noEmit`으로 수동 실행). `pnpm lint`/`pnpm format` 대상이 `app src`뿐이라 `proxy.ts`(138줄)·`scripts/`·`*.mts`는 검사 사각지대. Vitest/RTL/jsdom 설정은 완비돼 있다(`vitest.config.mts`, `vitest.setup.ts`).

**문제** — 순수 함수로 잘 분리된 계산 로직이 무방비다. 아래 표의 함수들은 입력/출력이 명확해 테스트하기 쉬운데 하나도 없다. `.claude/rules/git-workflow.md`는 "CI 통과 후 머지"를 요구하지만 CI 자체가 없다.

**제안**

1. `"typecheck": "tsc --noEmit"` 스크립트 추가
2. 아래 표 순서로 순수 함수 테스트 작성
3. GitHub Actions에 `lint` + `typecheck` + `test` 추가

| 함수                                                              | 위치                                                 | 비고                                 |
| ----------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------ |
| `getSafeNextPath`                                                 | `src/shared/lib/getSafeNextPath.ts`                  | 오픈 리다이렉트 방어 — 보안상 최우선 |
| `buildMonthlyExpenses`/`buildWeeklyExpenses`/`buildDailyExpenses` | `src/features/transaction/lib/`                      | 월/주/일 집계, 경계값(월말·연말)     |
| `buildCategoryBudgets`/`buildExpenseByCategory`                   | `src/features/transaction/lib/`                      | 카테고리 집계                        |
| `monthRange`                                                      | `src/features/transaction/lib/monthRange.ts`         | KST 월 경계 계산                     |
| `buildEventLanes`                                                 | `src/pages/calendar/model/buildEventLanes.ts`        | 일정 레인 배치                       |
| `visibleRange`                                                    | `src/pages/calendar/model/visibleRange.ts`           | 달력 가시 범위                       |
| `getErrorMessage`                                                 | `src/shared/lib/getErrorMessage.ts`                  | 에러 메시지 추출                     |
| `mapInviteError`                                                  | `src/entities/householdInvite/lib/mapInviteError.ts` | 초대 에러 매핑                       |

### 12. loading.tsx/Suspense/ErrorBoundary 전무

**근거** — `find app -name 'loading.tsx'` 0건. `grep -rn "Suspense" src app` 0건. `error.tsx`는 [`app/(app)/error.tsx`](<../app/(app)/error.tsx>) 하나뿐이라 `(auth)`/`(marketing)` 그룹 에러는 전체 페이지를 교체하는 `app/global-error.tsx`로 떨어진다.

**문제** — 스트리밍 SSR을 전혀 활용하지 않고, 보호 라우트가 전부 `'use client'`라 첫 페인트는 빈 셸 → JS 로드 → 쿼리 시작 순서다. 게다가 TanStack Query의 `throwOnError`가 설정돼 있지 않아 쿼리 에러는 `error.tsx`에 도달하지 않고 각 화면에서 문자열로만 표시된다 — "렌더 예외는 error.tsx, 데이터 에러는 문자열"이라는 전략이 있다면 명문화가 필요하고, 없다면 하나로 통일해야 한다.

**제안** — `(auth)`/`(marketing)` 그룹에도 `error.tsx` 추가. 대시보드처럼 로딩이 긴 화면부터 `loading.tsx` 스켈레톤 도입.

### 13. 한국어 앱인데 폰트 3종 모두 latin 서브셋만 로드

**근거** — [`app/layout.tsx`](../app/layout.tsx)가 `Geist`/`Geist_Mono`/`Instrument_Serif`를 전부 `subsets: ['latin']`으로 로드한다. `<html lang="ko">`이고 전체 UI가 한글이다. `--font-sans`([`globals.css:14-15`](../src/shared/styles/globals.css))의 폴백에 적힌 `Pretendard`를 로드하는 코드는 없다. `Geist_Mono`는 `<html>`에 CSS 변수까지 붙지만(`app/layout.tsx`) 전체 CSS에서 참조 0건이다.

**문제** — latin 서브셋은 한글을 커버하지 않아 본문 대부분이 시스템 폰트로 폴백되는 상태로 보인다(직접 렌더링 검증은 하지 않음 — 확인 필요). 즉 폰트 3종을 다운로드하면서 정작 본문에는 쓰이지 않을 가능성이 있고, `Geist_Mono`는 참조가 아예 없어 순수 낭비 다운로드다.

**제안** — `Geist_Mono`를 쓰지 않는다면 제거한다. 한글 본문용으로 `next/font/google`의 `Noto_Sans_KR` 등을 추가하거나, Pretendard를 실제로 로드하도록 정리한다.

### 14. 디자인 시스템 부재

**근거** — `src/shared/ui/index.ts`가 6개만 export(ConfirmDialog/DatePicker/GridBackdrop/Modal/MoaLogo/TimePicker) — Button/Input/Card 없음. `grep -rhoE '^\.[a-zA-Z]*[Bb]utton'` 결과 CSS Module에 버튼 클래스 **103개**(`.primaryButton` 15회, `.secondaryButton` 15회, `.dangerButton` 12회, `.textButton` 9회 등), 카드 클래스 38개. `globals.css`는 60줄로 색·간격 토큰만 있고 타이포·그림자·z-index·breakpoint 토큰이 없다. breakpoint 6종 혼용(`48rem`/`768px`/`47.99rem`/`960px`/`64rem`/`640px`). `prefers-color-scheme` 사용 0건(다크 모드 미지원)이라 [`welcome.module.css:126-137`](../src/pages/welcome/ui/welcome.module.css)이 전역 토큰 `--color-bg`/`--color-surface`를 슬라이스 내부에서 덮어쓰는 우회가 발생했다. CSS Module 내 하드코딩 색상 70건(`var(--color-*)` 사용 1,119회 대비) — 최다 반복은 `#b91c1c`(에러 텍스트, 9개 파일), `#991b1b`, `#fff`, `rgba(15, 23, 42, 0.12)`.

**문제** — 공통 컴포넌트가 없어 같은 버튼 스타일을 슬라이스마다 새로 정의하고 있다. 새 화면을 추가할 때마다 CSS가 늘어나고, 색상 값이 흩어져 있어 브랜드 색을 바꾸려면 수십 개 파일을 손대야 한다.

**제안** — `shared/ui`에 `Button`(primary/secondary/danger variant), `Card`, `Input` 등 기본 컴포넌트를 추가하고 기존 CSS Module 버튼 클래스를 단계적으로 교체한다. `globals.css`에 타이포·그림자·breakpoint 토큰을 추가하고, `#b91c1c` 등 반복되는 색을 `--color-danger-text` 같은 토큰으로 승격한다.

---

## 🟡 낮음 — 구조·접근성·정리

### 15. 컨벤션 문서 충돌·드리프트

> **진행 상황 (✅ 완료)** — 두 규칙 충돌 모두 "문서를 실제 코드에 맞춘다" 쪽으로 해소했다. `.claude/CLAUDE.md`의 폴더명 규칙을 kebab-case → camelCase로 수정(실제 코드·`.cursor/rules`와 일치). `.claude/rules/pages-design.md`의 `index.ts` re-export 전용 규칙을 다수 패턴(`index.tsx`에 구현 직접 포함)으로 갱신해 `.cursor/rules/pages-design.mdc`와도 일치시켰다 — 이에 따라 `createHousehold`/`createProfile`의 이름 변경 재수출도 더 이상 규칙 위반이 아니게 됐다. `.claude/settings.json`의 npm 명령을 pnpm으로 교체하고, 존재하지 않던 `typecheck` 스크립트 참조를 `npx tsc --noEmit`으로, `PostToolUse` 훅의 `echo` 플레이스홀더를 실제 prettier 연동으로 교체했다(파이프·발화 테스트로 검증). 코드 리네임은 발생하지 않았다.

- `.cursor/rules/base.mdc`: "모든 파일 및 폴더명은 **camelCase**" ↔ `.claude/CLAUDE.md`: "슬라이스·폴더명은 **kebab-case**". 실제 코드는 전부 camelCase(`householdMember`, `scheduleCategory`, `errorFallback`, `acceptInvite`, `appShell`, `siteFooter`, `pwaInstall` 등 12개 슬라이스) → CLAUDE.md 규칙이 코드·Cursor 규칙 양쪽과 불일치한다.
- `.claude/rules/pages-design.md`는 "`index.ts`는 `ui/{Domain}Page`를 re-export만 한다"고 규정하지만 13개 중 8개 슬라이스가 `index.tsx`에 구현체를 직접 담는다([ARCHITECTURE.md](./ARCHITECTURE.md) 참고). 같은 규칙의 `.cursor/rules/pages-design.mdc`는 반대로 "`index.tsx`가 완성된 페이지를 조립"하도록 규정 — 두 문서가 정면 충돌한다.
- `.claude/settings.json`의 권한 allowlist가 전부 `Bash(npm run ...)`인데 프로젝트는 pnpm이라 매칭되지 않는다. 존재하지 않는 `npm run typecheck`도 등재돼 있다. `PostToolUse` 훅은 `echo '[hook] ... 교체하세요'`라는 미완성 플레이스홀더다.
- `createHousehold`/`createProfile`의 `index.ts`는 `CreateHouseholdForm as CreateHouseholdPage`처럼 이름만 바꿔 재수출한다 — "파일도 `ui/{Domain}Page.tsx`여야 한다"는 규칙과 어긋난다.

**제안** — camelCase/kebab-case 중 실제 코드가 따르는 camelCase를 CLAUDE.md에 반영해 문서를 코드에 맞춘다(대규모 폴더 리네임보다 문서 수정이 현실적). pages `index` 관례은 팀이 6개 쪽(현행 규칙)과 8개 쪽(다수) 중 하나로 결정해 반대쪽을 리팩터한다. `.claude/settings.json`의 npm 명령을 pnpm으로 교체하고 훅을 실제 포맷터 연결로 바꾸거나 제거한다.

### 16. Public API deep import 17건

> **진행 상황 (✅ 완료)** — `@/shared/lib/echarts`(5건)와 `@/shared/api/server`·`@/features/onboarding/server`(9건)는 의도된 보조 진입점이므로 `.claude/CLAUDE.md`에 "서버 전용 코드는 `{slice}/server.ts` 보조 진입점을 둘 수 있다"를 명문화했다(코드 변경 없음). 실제 코드 수정이 필요했던 두 건은 해소했다: `@/pages/write/edit` deep import는 `src/pages/write/index.tsx`가 `WriteEditPage`를 re-export하도록 바꿔 제거했고, `onboardingForm.module.css`는 `features/onboarding/ui/OnboardingFormLayout` 공용 컴포넌트로 승격하면서 CSS 자체도 `features/onboarding` 배럴에서 `onboardingFormStyles`로 재수출해 두 페이지가 Public API를 통해서만 접근하도록 정리했다. `eslint-plugin-boundaries` 등 린트 강제 도입은 하지 않았다(향후 과제로 남김).

**근거** — `@/shared/lib/echarts` 5건(홈 대시보드 카드들, 번들 분리 목적 — `shared/lib/index.ts`에는 미export), `@/features/onboarding/server` 5건, `@/shared/api/server` 4건(둘 다 서버 전용 보조 진입점), `@/shared/ui/onboardingForm.module.css` 2건(CSS Module 직접 import), `@/pages/write/edit` 1건(중첩 서브슬라이스). 상세는 [ARCHITECTURE.md](./ARCHITECTURE.md#public-api-규칙).

**문제** — 대부분 의도된 예외이나 CLAUDE.md에 "보조 진입점" 개념이 명문화돼 있지 않아 위반인지 설계인지 구분이 안 된다. `eslint-plugin-boundaries` 등 강제 수단이 없어 앞으로도 같은 패턴이 규칙 없이 늘어날 수 있다.

**제안** — CLAUDE.md에 "서버 전용 코드는 `{slice}/server.ts` 보조 진입점을 둘 수 있다"를 명문화하거나, `eslint-plugin-boundaries`/`no-restricted-imports`로 나머지 우회를 막는다. `onboardingForm.module.css`는 화면 전용 스타일이므로 `shared/ui`가 아니라 사용하는 두 페이지 쪽으로 옮기거나 공용 컴포넌트로 승격한다.

### 17. widgets 설계 규칙 위반 2건

> **진행 상황 (✅ 완료 — 대안 방식)** — `navIcons.ts`는 제안대로 `config/`로 이동했다. `NoHouseholdRedirect`는 처음에 `features/onboarding`으로 옮겼으나 코드 리뷰에서 더 심각한 문제가 드러나 되돌렸다: 이 컴포넌트는 `features/household`(데이터)와 `features/onboarding`(리다이렉트 로직)를 동시에 필요로 해서, 어느 한 features 슬라이스 안에 두면 반드시 다른 features 슬라이스를 직접 참조하게 되어 FSD의 **동일 레이어 참조 금지**(예외 없는 핵심 규칙)를 위반한다. widgets에 남기면 widgets→features 방향이라 레이어 규칙 자체는 지켜지고, 위반되는 것은 "widgets는 도메인 훅을 직접 호출하지 않는다"는 widgets 자체의 스타일 권고뿐이다. 여러 페이지에 걸친 전역 리다이렉트를 매 페이지가 props로 내리는 대안보다 이쪽이 낫다고 판단해, `.claude/rules/widgets-design.md`에 이 경우를 명시적 예외로 문서화하고 컴포넌트를 widgets에 남겼다.

**근거** — [`NoHouseholdRedirect.tsx`](../src/widgets/appShell/ui/NoHouseholdRedirect.tsx)가 widget 내부에서 `useCurrentHousehold`(features)와 `redirectIfNoHouseholds`를 직접 호출한다. `widgets-design.md`는 "데이터는 상위(pages)에서 훅으로 조회해 props로 내려받는다"고 규정한다. [`navIcons.ts`](../src/widgets/appShell/ui/navIcons.ts)(아이콘 상수 맵)가 `config/`가 아니라 `ui/`에 위치한다.

**제안** — `NoHouseholdRedirect`가 필요로 하는 데이터를 `AppShell`이 상위에서 받아 props로 내리거나, 이 컴포넌트를 features 레이어로 옮긴다. `navIcons.ts`는 `config/`로 이동한다.

### 18. 로딩/에러 문구에 aria-live·role="alert" 누락

> **진행 상황 (✅ 완료 — 범위 한정)** — 전역 로딩/에러 상태 문구 8개 파일(`HouseholdGuard`, `write/edit`, `settings`의 `AccountSection`·`CategorySection`·`MembersSection`, `home/DashboardSection`, `calendar`, `history`)에 로딩은 `role="status"`, 에러는 `role="alert"`를 추가했다(시각적 변화 없음). 폼 필드별 유효성 검증 메시지(`TransactionForm`, `ScheduleForm` 등)는 성격이 다르고 파일 수가 많아 이번 범위에서 제외했다 — 별도 검토 필요. 공통 로딩/에러 컴포넌트로의 승격(중복 방지)은 하지 않았다 — `shared/ui`에 `Button`/`Card` 등을 추가하는 #14(디자인 시스템, Medium)와 함께 처리하는 게 적절하다고 판단해 이번 범위에서는 반복 적용만 했다. 또한 `role` 속성이 조건부로 마운트되는 요소에 붙어 있어(예: `{isLoading ? <p role="status">...</p> : null}`) 아주 짧게 지나가는 로딩 상태에서는 스크린리더가 announce 타이밍을 놓칠 수 있다는 지적이 리뷰에서 나왔다 — 지금 구현으로도 WCAG 4.1.3 요건은 충족하지만, 상시 마운트 + 내용 교체 패턴(`src/pages/history/ui/ListFooter.tsx`가 이미 이 패턴을 씀)으로 개선할 여지가 남아 있다.

**근거** — 로딩 상태가 전부 정적 `<p>불러오는 중…</p>`([`HouseholdGuard.tsx`](../src/features/household/ui/HouseholdGuard.tsx), [`DashboardSection.tsx`](../src/pages/home/ui/DashboardSection.tsx))로 `role="status"`/`aria-live`가 없다. 에러 문구도 `role="alert"`가 없다 — [`AppErrorPage.tsx:19`](../src/pages/errorFallback/ui/AppErrorPage.tsx)는 제대로 붙어 있어 대비된다. ECharts 캔버스 차트 5개는 대체 텍스트·표 형태 대안이 없다.

**문제** — 스크린 리더 사용자에게 로딩·에러 상태 변화가 알려지지 않는다.

**제안** — 공통 로딩/에러 컴포넌트(#14의 디자인 시스템 작업과 함께)에 `role="status"`/`role="alert"`를 기본으로 포함시킨다. 차트는 최소한 수치를 요약하는 시각적으로 숨겨진 텍스트를 추가한다.

> 접근성 기반 자체는 양호하다 — `aria-*` 165회(50개 파일), `role` 40회, `prefers-reduced-motion` 6곳, `:focus-visible` 16개 파일, alt 필수화된 `next/image`.

### 19. 캐시·상태 관리 세부 개선점

> **진행 상황 (✅ 완료 — 부분)** — 첫 번째·두 번째 항목은 그대로 처리했다: `useCreateHousehold`의 중복 `invalidateQueries` 제거, `useCurrentHousehold`의 predicate를 "두 번째 요소가 `list`/`invites`이고 세 번째 요소가 대상 householdId와 일치"하는 조건으로 좁혔다(household가 다른 feature의 queryKey 팩토리를 import할 수 없어 predicate 방식 자체는 유지, 매칭 조건만 정교화). "저장 id 검증 → 첫 항목 폴백" 중복 로직은 `resolveEffectiveHouseholdId` 헬퍼로 추출해 파생값 계산·`useEffect` 양쪽에서 재사용하도록 정리했다. **세 번째(Zustand `persist` 미들웨어 전환)는 하지 않았다** — 기존 `localStorage` 저장 포맷(원시 문자열)이 `persist`가 기대하는 JSON 포맷과 달라 마이그레이션이 필요하고, 이 항목의 우선순위(낮음) 대비 위험이 크다고 판단했다. 여전히 남은 과제다.

- [`useCreateHousehold.ts`](../src/features/household/model/useCreateHousehold.ts)가 `setQueryData`로 캐시를 직접 갱신한 직후 같은 키를 `invalidateQueries`한다 — 낙관적 삽입이 즉시 네트워크 재요청으로 덮여 의미가 반감된다. 둘 중 하나만 남긴다.
- [`useCurrentHousehold.ts`](../src/features/household/model/useCurrentHousehold.ts)의 `predicate: (query) => query.queryKey.includes(id)` 무효화는 얕은 비교라 `profileQueryKeys.byIds`처럼 중첩 배열을 담은 키를 못 잡고, 반대로 우연히 같은 문자열을 담은 무관한 키까지 무효화할 수 있다. 각 도메인 팩토리의 `list(householdId)` 키를 명시적으로 무효화하는 편이 예측 가능하다.
- Zustand `persist` 미들웨어를 쓰지 않고 `localStorage` 수동 읽기/쓰기 + `hydrated` 플래그로 SSR mismatch를 직접 방지한다([`currentHouseholdStore.ts`](../src/features/household/model/currentHouseholdStore.ts)). "저장 id 검증 → 목록 첫 항목 폴백" 로직이 파생값 계산과 `useEffect` 두 곳에 중복 구현돼 있어 드리프트 위험이 있다. `persist` + `skipHydration` + `onRehydrateStorage`로 교체하면 단순해진다.

### 20. 에러 타입 부재, 뮤테이션 onError 0건

> **진행 상황 (✅ 완료 — 최소 조치)** — `src/shared/lib/getErrorCode.ts`를 추가해 `PostgrestError` 등 `code` 필드를 가진 에러에서 안전하게 코드를 추출할 수 있게 했고, `mapInviteError.ts`가 직접 만들던 코드 추출 로직을 이 유틸로 교체했다(문자열 매칭 동작 자체는 그대로 유지, 회귀 테스트로 고정). **전역 에러 클래스(`AppError`)나 `QueryClient` 전역 `onError` 도입은 하지 않았다** — 이건 #7(Medium, `retry` 설정 등 QueryClient 기본값 정비)과 함께 처리해야 의미가 있어 이번 낮음 우선순위 범위에서는 제외했다. "로그인이 필요합니다." 문자열 4곳 중복도 그대로 남아 있다.

**근거** — 던지는 값이 raw `PostgrestError`(`throw error`)이거나 `new Error('한글 메시지')`뿐이다. [`mapInviteError.ts:11-13`](../src/entities/householdInvite/lib/mapInviteError.ts)은 `message.includes(key)` 문자열 매칭이라 DB의 영문 에러 메시지가 바뀌면 조용히 깨진다. 21개 뮤테이션 중 `onError` 콜백 0건 — 에러는 각 UI가 `mutation.error`를 직접 읽어 렌더한다. "로그인이 필요합니다." 문자열이 4곳(`getCachedUser.ts`, `useCreateTransaction.ts`, `useCreateHousehold.ts`, `mapInviteError.ts`)에 중복되고, `getCachedUser`가 이미 던지므로 호출부의 재확인은 도달 불가 코드다.

**제안** — 도메인 에러를 구분할 수 있는 최소한의 에러 클래스(`AppError` + `code`)를 도입하거나, 최소한 `getErrorMessage`가 `PostgrestError`의 `code` 필드를 활용하도록 확장한다. 전역 `onError`(#7)와 함께 정리하면 좋다.

### 21. 기타 정리 항목

> **진행 상황 (✅ 대부분 완료)** — 아래 각 항목에 처리 상태를 표시했다. `/stats` 스텁과 커밋 타입 혼용은 그대로 남겨뒀다(전자는 동작에 문제가 없는 스텁이라 리다이렉트 방식 변경이 트레이드오프를 수반해 이번엔 보류, 후자는 과거 커밋이라 소급 수정 대상이 아님). dev/build 번들러 차이는 이미 [ARCHITECTURE.md](./ARCHITECTURE.md)에 문서화돼 있어 별도 조치가 필요 없었다.

- [`app/(app)/stats/page.tsx`](<../app/(app)/stats/page.tsx>)는 `redirect('/history')`만 하는 스텁이면서 `robots.ts`·`proxy.ts` matcher·`PUBLIC_PATHS`에 흔적이 남아 있다. 영구 이동이 확정이면 `next.config.ts`의 `redirects()`로 옮겨 301을 반환하게 하고 흔적을 정리한다. — **미착수**(동작 자체는 정상이라 이번 범위에서 보류)
- 빈 디렉터리 3개: `src/features/onboarding/ui`, `src/pages/settings/model`, `src/widgets/appShell/model`. — **완료** (`settings/model`, `appShell/model` 삭제. `onboarding/ui`는 이번 작업으로 실제 파일이 생겨 자연히 해소)
- `src/shared/ui/.gitkeep` 잔존 — `shared/ui`에 실제 컴포넌트가 6개 있으므로 더 이상 필요 없다. — **완료**
- [`src/pages/settings/settings.module.css`](../src/pages/settings/ui/settings.module.css)만 다른 슬라이스와 달리 `ui/` 밖(슬라이스 루트)에 있어 8개 파일이 `'../settings.module.css'`로 상위 참조한다. `ui/settings.module.css`로 이동하는 편이 일관적이다. — **완료**
- `png-to-ico` 의존성의 코드 내 사용처가 0건이다(`package.json` devDependencies). 실제로 쓰지 않으면 제거를 검토한다. — **완료** (`pnpm remove png-to-ico`)
- 커밋 타입이 혼용된다 — `mod:`는 `.claude/rules/git-workflow.md`가 정의한 타입 목록(`feat/fix/refactor/docs/test/chore/perf/style/ci/build`)에 없고, 번들 최적화(`8295958`)가 `fix:`로 기록돼 있다. — **미착수**(과거 커밋이라 소급 수정 대상 아님, 향후 커밋부터 규칙 준수)
- `public/manifest.json`에 `id`/`scope`/`shortcuts` 필드가 없다. `id`는 설치 아이덴티티 안정성에, `shortcuts`("작성", "달력")는 홈 화면 롱프레스 메뉴에 도움이 된다. — **완료**
- [`GlobalErrorPage.tsx`](../src/pages/errorFallback/ui/GlobalErrorPage.tsx)는 `globals.css`를 상속받지 못해 인라인 스타일이 불가피하다는 주석이 있으나, 값 자체(`#f4f6f8`, `#0f172a`, `#64748b`, `#e2e8f0`)가 `globals.css`의 토큰과 중복 하드코딩돼 있다. 토큰 값이 바뀌면 이 파일도 함께 손봐야 한다는 점을 주석에 남긴다. — **완료**
- `next dev`는 turbopack, `next build`는 `--webpack`(next-pwa 제약)이라 dev/prod 번들러가 다르다. PWA 관련 프로덕션 전용 버그가 dev에서 재현되지 않을 수 있다는 점을 팀이 인지하고 있어야 한다. — **완료**(ARCHITECTURE.md에 이미 문서화됨, 추가 조치 불필요)

---

## 이미 잘 돼 있어 건드리지 말 것

아래는 감사 중 확인한, 이미 양호하거나 의도적으로 그렇게 설계된 부분이다. "느리다/이상하다"는 인상만으로 되돌리지 않는다.

- **ECharts 번들 분리** — `echarts/core` + 필요한 모듈만 개별 등록([`src/shared/lib/echarts.ts`](../src/shared/lib/echarts.ts), [`src/pages/welcome/lib/echarts.ts`](../src/pages/welcome/lib/echarts.ts)), 홈/랜딩 등록 모듈을 의도적으로 분리(주석에 이유 명시 — 공유하면 webpack이 두 청크를 합쳐 서로 안 쓰는 차트 타입까지 받아간다), 대시보드 카드는 `next/dynamic({ ssr: false })`로 지연 로드. `import * as echarts from 'echarts'`(풀 임포트) 0건.
- **`next/image`/alt** — raw `<img>` 0건, `MoaLogo`가 `alt` prop을 필수로 강제.
- **`getSafeNextPath`의 오픈 리다이렉트 방어** — 화이트리스트 정규식 + `://`, `\`, `//`, `?`, `#` 차단.
- **SEO 일체** — `sitemap.ts`(가이드 아티클 동적 포함), `robots.ts`(비프로덕션 전면 차단), metadata 20개 라우트 커버, JSON-LD 4종(WebSite/Organization/WebApplication/Article/BreadcrumbList).
- **FSD 레이어 경계** — 역방향·동일 레이어 직접 참조 0건(전수 조사 결과).
- **`.env` 위생** — git 추적 0, 히스토리 전체에 커밋 이력 없음.
- **`console.*` 청결도** — 앱 코드(`src/`, `app/`) 내 디버그 로그 잔존 0건. 남은 3건은 전부 의도된 위치(에러 바운더리 로깅, 빌드 스크립트).
- **타입 안전성 기초** — `any` 0건, `@ts-ignore`/`eslint-disable` 0건, `strict: true`.

---

## 권장 착수 순서

1. **#1 스키마·RLS 덤프** — 다른 모든 DB 작업의 전제이며 현재 가장 큰 보안 노출
2. **#2 반복 거래 재생성 버그** — 사용자가 실제로 마주치는 데이터 오류
3. **#5 조회 절단 여부 확인** — 현재 Supabase 행 제한 설정을 확인해 이미 틀린 값을 보여주고 있는지 판정
4. **#11 typecheck 스크립트 + 순수 함수 테스트 + CI 골격** — 이후 모든 리팩터링의 안전망
5. **#10 env 검증 + `.env.example`** — 30분 내외, 신규 기여자 온보딩에 즉시 효과
6. **#4 Supabase 타입 생성** — #1과 함께 진행하면 한 번에 검증 가능
7. **#15 규칙 문서 충돌 해소** — camelCase/kebab-case, pages index 관례 중 정본 결정
8. **#14 디자인 시스템 착수** — 버튼/카드부터 `shared/ui`로 승격, 여유가 될 때
