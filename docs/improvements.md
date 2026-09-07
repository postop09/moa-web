# 개선 과제

현재 코드베이스를 훑어보고 정리한 개선 후보입니다. 우선순위는 **사용자에게 잘못된 데이터가 보이는가 → 장애 시 복구 가능한가 → 유지보수 비용** 순으로 매겼습니다.

각 항목은 `근거(파일:라인)` → `문제` → `제안` 순으로 씁니다.

관련 문서: [프로젝트 개요](./overview.md) · [인증 및 온보딩](./authOnboarding.md)

---

## 요약

| # | 항목 | 영역 | 우선순위 | 상태 |
| - | ---- | ---- | -------- | ---- |
| 1 | 삭제한 반복 거래가 다음 날 다시 생성됨 | DB | 🔴 높음 | - |
| 2 | 반복 거래 배치가 매일 전체 과거를 재순회 | DB | 🔴 높음 | - |
| 3 | 기본 스키마·RLS 마이그레이션이 저장소에 없음 | DB | 🔴 높음 | - |
| 4 | 거래 목록 조회에 페이지네이션/limit 없음 | 데이터 | 🔴 높음 | 🟡 부분 완료 |
| 5 | 자산 추이가 조회 창(12개월) 밖 잔액을 무시 | 로직 | 🟠 중간 | ✅ 완료(대안) |
| 6 | 클라이언트 로컬 TZ vs DB의 Asia/Seoul 불일치 | 로직 | 🟠 중간 | ✅ 완료 |
| 7 | Supabase 클라이언트에 `Database` 제네릭 미적용 | 타입 | 🟠 중간 | - |
| 8 | `error.tsx` / `not-found.tsx`가 하나도 없음 | 안정성 | 🟠 중간 | ✅ 완료 |
| 9 | 환경변수 비검증 + `!` 논널 단언 | 안정성 | 🟠 중간 | - |
| 10 | README가 안내하는 `.env.local.example`이 없음 | DX | 🟠 중간 | - |
| 11 | 테스트 0개, CI 없음 | 품질 | 🟠 중간 | - |
| 12 | 에러 메시지 추출 로직이 19개 파일에 중복 | 중복 | 🟡 낮음 | ✅ 완료 |
| 13 | 가계부 로딩/에러/빈 상태 보일러플레이트 반복 | 중복 | 🟡 낮음 | ✅ 완료 |
| 14 | FSD 레이어 규칙이 린트로 강제되지 않음 | 구조 | 🟡 낮음 | - |
| 15 | import 정렬 규칙 미적용 | 구조 | 🟡 낮음 | - |
| 16 | ECharts 전체 번들을 정적 import | 성능 | 🟠 중간 | ✅ 완료 |
| 17 | 뮤테이션마다 `auth.getUser()` 네트워크 왕복 | 성능 | 🟡 낮음 | - |
| 18 | 달력의 멤버 → 프로필 조회 워터폴 | 성능 | 🟡 낮음 | - |
| 19 | 남아 있는 `console.log` | 정리 | 🟡 낮음 | - |
| 20 | 멤버 색상이 배열 인덱스 기반 | UX | 🟡 낮음 | - |

---

## 🔴 높음 — 데이터 정확성

### 1. 삭제한 반복 거래가 다음 날 다시 생성됨

**근거** — `supabase/migrations/20260902150100_add_generate_recurring_transactions_function.sql`

```sql
IF NOT EXISTS (
  SELECT 1 FROM transactions child
  WHERE child."recurringSourceId" = template.id
    AND date_trunc('month', child."transactionDt" AT TIME ZONE 'Asia/Seoul')
      = date_trunc('month', month_cursor)
) THEN
  INSERT INTO transactions (...)
```

**문제** — 중복 방지가 "그 달에 해당 사본 행이 존재하는가"로만 판정합니다. 사용자가 자동 생성된 거래를 삭제하면 행이 사라지므로, 다음 날 00:05 cron이 같은 거래를 다시 만들어 냅니다. 사용자 입장에서는 지운 지출이 되살아나는 버그로 보입니다.

**제안** — 생성 이력을 행의 존재와 분리합니다.

- `recurring_generation_log(templateId, month)` 같은 별도 이력 테이블에 UNIQUE 제약을 두고, INSERT 여부를 이력 기준으로 판정
- 또는 템플릿에 `lastGeneratedMonth` 컬럼을 두고 그 이후의 달만 생성
- 어느 쪽이든 기존 `transactions_recurring_source_month_unique` 인덱스를 살려 `INSERT ... ON CONFLICT DO NOTHING`으로 바꾸면 `NOT EXISTS` 서브쿼리도 함께 걷어낼 수 있습니다

### 2. 반복 거래 배치가 매일 전체 과거를 재순회

**근거** — 같은 파일의 이중 루프

```sql
FOR template IN SELECT * FROM transactions WHERE "isRecurring" = true ... LOOP
  month_cursor := start_month;              -- 템플릿 생성 다음 달
  WHILE month_cursor <= end_month LOOP      -- 이번 달까지
```

**문제** — 매일 실행될 때마다 모든 템플릿에 대해 *생성 시점부터 이번 달까지* 전체 개월을 다시 순회하며 각 달마다 `NOT EXISTS` 서브쿼리를 돌립니다. 비용이 `템플릿 수 × 누적 개월 수`로 계속 커지고, 서비스를 오래 쓸수록 단조 증가합니다. 또 템플릿 테이블에 인덱스가 없어 (#3 참고) 매일 `transactions` 풀스캔이 발생합니다.

**제안**

- 평상시 실행은 **이번 달만** 처리하도록 범위를 좁히고, 과거 보정은 파라미터를 받는 별도 함수로 분리
- `WHERE "isRecurring" = true AND "recurringSourceId" IS NULL` 조건에 맞는 부분 인덱스 추가
- `RAISE LOG`로 처리 건수를 남겨 배치 실패를 관측 가능하게

### 3. 기본 스키마·RLS 마이그레이션이 저장소에 없음

**근거** — `supabase/migrations/`에는 반복 거래 관련 3개 파일만 있고, `transactions` / `households` / `profiles` 등의 `CREATE TABLE`이 없습니다. `grep -ri "row level security\|create policy" supabase/migrations` 결과가 0건입니다.

**문제** — 새 Supabase 프로젝트로 환경을 재현할 수 없고, 무엇보다 **RLS 정책이 코드 리뷰·버전 관리 대상 밖**에 있습니다. 공유 가계부 앱에서 RLS는 "다른 가계부 데이터를 못 보게 하는" 유일한 실질 방어선인데, 지금은 대시보드에서 손으로 바뀐 상태가 어딘가에만 존재합니다.

**제안**

- `supabase db pull`로 현재 스키마 + 정책을 베이스라인 마이그레이션으로 덤프해 커밋
- 이후 스키마 변경은 마이그레이션 파일로만 진행
- `households` / `household_members` / `transactions` / `schedules` 각각의 정책을 문서에도 표로 남기기 (`docs/`에 `database.md` 신설 추천)

### 4. 거래 목록 조회에 페이지네이션/limit 없음

> **진행 상황 (🟡 부분 완료)** — `listTransactions`에 `.range()`/`limit`/`offset`/서버 필터(`type`, `categoryId`)와 `{ count: 'exact' }`를 추가했고, 내역(history) 화면에 `useInfiniteQuery` 기반 무한 스크롤을 도입해 클라이언트 필터를 서버로 옮겼습니다(월 선택 모드는 페이지당 500건, 전체 기간 모드는 50건). 단기 제안은 반영됐지만 **중기 제안(대시보드 집계의 Postgres RPC 이관)은 미착수**이며, `useHomeDashboard`는 여전히 12개월치 전체 거래를 받아 클라이언트에서 집계합니다.

**근거** — `src/entities/transaction/api/listTransactions.ts`

```ts
let query = supabase.from(TABLE_NAME).select('*')
  .eq('householdId', householdId)
  .order('transactionDt', { ascending: false });
// from/to 필터만 있고 .range() / .limit() 없음
```

호출부인 `src/pages/home/model/useHomeDashboard.ts:34` 은 **12개월치 전 거래**를 한 번에 받아 클라이언트에서 집계합니다.

**문제** — 두 가지가 겹칩니다.

1. **조용한 절단** — PostgREST에는 응답 최대 행 수 설정(`db-max-rows`, Supabase 기본값은 보통 1000)이 있습니다. 여기에 걸리면 에러 없이 잘린 배열이 돌아오고, 대시보드 합계·자산 추이가 **틀린 값을 정상처럼** 보여줍니다. 프로젝트의 현재 설정값을 먼저 확인해야 합니다.
2. **전송량** — 여러 명이 몇 년 쓴 가계부에서 12개월치 전 행을 매번 내려받아 브라우저에서 집계하는 구조는 오래 버티기 어렵습니다.

**제안**

- 단기: `listTransactions`에 `.range()`를 노출하고, 절단 여부를 감지할 수 있게 `{ count: 'exact' }`를 요청
- 중기: 대시보드 집계를 Postgres RPC(월별 유형 합계, 카테고리별 합계)로 내리고 클라이언트는 집계 결과만 받기 — `buildMonthlyExpenses` / `buildAssetTrends` / `buildExpenseByCategory` 가 대상
- 내역 화면은 무한 스크롤 + 서버 필터(현재 유형·카테고리 필터가 클라이언트에서 적용됨)

---

## 🟠 중간 — 로직·안정성

### 5. 자산 추이가 조회 창 밖의 잔액을 무시

> **진행 상황 (✅ 완료 — 대안 방식)** — 제안된 "시드값 RPC" 방식 대신, 절대 잔액을 오독시키던 "자산 동향" 카드 자체를 제거하고 선택된 달의 **일일 지출**을 보여주는 `DailyExpenseCard`로 교체했습니다(`buildAssetTrends`/`AssetTrendCard` 삭제). 조회 창 밖 잔액을 참조하지 않는 지표로 바뀌어 문제 자체가 해소되었습니다.

**근거** — `src/features/transaction/lib/buildAssetTrends.ts`

```ts
let cumulativeIncome = 0;   // 항상 0에서 시작
...
asset: cumulativeIncome - cumulativeExpense - cumulativeInsurance,
```

전달되는 데이터는 `useHomeDashboard`가 가져온 최근 12개월(`YEAR_WINDOW`)뿐입니다.

**문제** — 누적 자산이 "12개월 전 = 0"을 전제로 계산됩니다. 그 이전의 수입·지출은 반영되지 않고, 달이 바뀌어 창이 밀릴 때마다 **같은 과거 달의 자산 값이 달라집니다**. 의도된 동작("최근 1년간의 순증감")일 수도 있지만, 차트 제목이 "자산"인 이상 사용자는 절대 잔액으로 읽습니다.

**제안** — 창 시작 이전의 누적 합을 서버에서 한 번 구해 시드로 넣거나(RPC 한 방), 차트 레이블을 "최근 12개월 순증감"으로 바꿔 의미를 맞추기.

### 6. 클라이언트 로컬 TZ와 DB의 Asia/Seoul 불일치

> **진행 상황 (✅ 완료)** — `src/features/transaction/lib/monthRange.ts`(`getMonthRange`/`getTrailingMonthsRange`, 서버 조회 경계값 계산)를 브라우저 로컬 타임존이 아닌 KST(UTC+9, DST 없음) 고정 연산으로 재작성했습니다. UI 상 "몇 월이 선택되어 있는지" 표시용 로컬 날짜 계산(`src/shared/lib/month.ts`)은 데이터 정확성과 무관해 의도적으로 그대로 두었습니다.

**근거**

- `src/features/transaction/lib/monthRange.ts` — `new Date(year, month, 1)`, 즉 **브라우저 로컬 타임존** 기준으로 월 경계를 만든 뒤 `toISOString()`
- `20260902150100_...sql` — `AT TIME ZONE 'Asia/Seoul'` 하드코딩

**문제** — 해외에 있거나 기기 TZ가 다른 사용자에게는 월 경계가 어긋나, 월초/월말 거래가 옆 달로 새거나 빠집니다. 반복 거래 생성일도 KST 고정이라 클라이언트가 보는 달과 어긋날 수 있습니다.

**제안** — 앱 전역에서 "가계부의 기준 타임존"을 하나로 정하고(예: KST 고정, 혹은 가계부 설정값), 월 경계 계산을 그 타임존 기준 유틸 하나로 통일. 지금은 `src/shared/lib/month.ts`와 `src/features/transaction/lib/monthRange.ts`에 날짜 계산이 나뉘어 있어 함께 정리하기 좋은 시점입니다.

### 7. Supabase 클라이언트에 `Database` 제네릭 미적용

**근거** — `src/shared/api/index.ts`

```ts
export type { SupabaseClient } from '@supabase/supabase-js';
```

제네릭 인자 없이 재수출하고, `createBrowserClient`/`createServerClient`도 타입 인자를 주지 않습니다.

**문제** — `strict: true`인데도 Supabase 응답이 사실상 검증되지 않습니다. `listTransactions`가 `Promise<ListTransactionsRes>`를 선언해도 그건 **개발자가 손으로 적은 약속**일 뿐이라, 컬럼 이름 오타나 스키마 변경이 런타임까지 살아서 갑니다. `.select('*')` 대신 컬럼을 골라 쓸 때 특히 위험합니다.

**제안**

```bash
supabase gen types typescript --project-id <id> > src/shared/api/database.types.ts
```

후 `SupabaseClient<Database>`로 좁히고, `entities/*/model/*.ts`의 수기 타입을 `Tables<'transactions'>` 파생으로 교체. 타입 생성을 CI(#11)에 넣어 드리프트를 잡습니다.

### 8. `error.tsx` / `not-found.tsx`가 하나도 없음

> **진행 상황 (✅ 완료)** — `app/global-error.tsx`, `app/(app)/error.tsx`, `app/not-found.tsx`를 추가했습니다(실제 UI는 FSD 관례에 따라 `src/pages/errorFallback/`에 위치, `app/`은 얇게 re-export만). `app/(app)/loading.tsx` 스켈레톤 승격은 "여유가 되면" 항목으로 별도 남겨두고 미착수했습니다.

**근거** — `find app src -name 'error.tsx' -o -name 'not-found.tsx' -o -name 'global-error.tsx' -o -name 'loading.tsx'` 결과 0건.

**문제** — 데이터 페칭 에러는 각 페이지에서 잘 처리하지만, **렌더 중 예외**를 잡을 경계가 없습니다. 차트 데이터가 예상 밖 모양이거나 컴포넌트가 던지면 Next의 기본 에러 화면(프로덕션에선 사실상 빈 화면)이 뜹니다. PWA로 설치해 쓰는 앱에서는 새로고침 방법조차 눈에 띄지 않아 체감이 더 나쁩니다.

**제안**

- `app/global-error.tsx` — 최후 방어선
- `app/(app)/error.tsx` — 앱 셸을 유지한 채 "다시 시도" 버튼 (`reset()`)
- `app/not-found.tsx` — 잘못된 `/write/[id]` 등
- 여유가 되면 `app/(app)/loading.tsx`로 현재 `불러오는 중…` 텍스트 11곳을 스켈레톤으로 승격

### 9. 환경변수 비검증 + `!` 논널 단언

**근거** — `src/shared/api/createBrowserClient.ts:5-6`, `createServerClient.ts:8-9`, `proxy.ts:48-49` 모두 `process.env.NEXT_PUBLIC_SUPABASE_URL!` 형태.

**문제** — 값이 비면 타입 검사는 통과하고 런타임에서야 터집니다. 특히 `proxy.ts`에서 터지면 **모든 요청**이 실패합니다.

**제안** — `src/shared/config/env.ts`에서 앱 시작 시 한 번 검증하고(간단한 수기 검사로도 충분, 필요하면 zod), 검증된 상수를 세 곳이 함께 임포트.

### 10. README가 안내하는 `.env.local.example`이 없음

**근거** — `README.md`는 `cp .env.local.example .env.local`을 안내하지만 저장소에 해당 파일이 없습니다 (`.gitignore`에 `!.env*.example` 예외까지 있는데 정작 파일이 없음).

**제안** — 필요한 키(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, 선택적으로 `NEXT_PUBLIC_SITE_URL`)를 담은 `.env.local.example` 추가. 5분짜리 작업인데 첫 기여자가 막히는 지점입니다.

### 11. 테스트 0개, CI 없음

**근거** — `*.test.*` / `*.spec.*` 0건, `.github/` 디렉터리 없음.

**문제** — 특히 순수 함수로 잘 분리해 둔 계산 로직이 무방비입니다. `buildAssetTrends`, `buildWeeklyExpenses`, `buildMonthlyExpenses`, `buildCategoryBudgets`, `buildExpenseByCategory`, `buildEventLanes`, `monthRange` — 전부 입력/출력이 명확해서 테스트하기 아주 쉬운데 하나도 없습니다. 위 #5, #6 같은 경계 조건 버그는 정확히 이 레이어에서 잡힙니다.

**제안**

1. Vitest 도입 후 `src/features/transaction/lib/`, `src/pages/calendar/model/buildEventLanes.ts`부터 (월 경계, 윤년, 2월 31일 반복일, 빈 배열)
2. GitHub Actions에 `lint` + `tsc --noEmit` + `test`. 지금 `tsc --noEmit`을 도는 npm 스크립트조차 없으므로 `"typecheck": "tsc --noEmit"` 추가부터

---

## 🟡 낮음 — 중복·구조

### 12. 에러 메시지 추출 로직 중복

> **진행 상황 (✅ 완료)** — `src/shared/lib/getErrorMessage.ts`를 추가해 `Error` 인스턴스뿐 아니라 Supabase `PostgrestError`처럼 `message` 필드만 있는 값도 처리하도록 했고, 18개 파일의 `error instanceof Error ? error.message : '...'` 패턴을 전부 `getErrorMessage(error, '...')` 호출로 교체했습니다(`entities/householdInvite/lib/mapInviteError.ts`는 메시지 문자열이 아니라 `Error` 객체 자체를 반환하는 다른 용도라 제외).

**근거** — `error instanceof Error ? error.message : '...'` 패턴이 **19개 파일 24줄**에 흩어져 있습니다 (`src/pages/calendar/index.tsx:106`, `history/index.tsx`, `settings/ui/MembersSection.tsx` 등).

**제안** — `src/shared/lib/getErrorMessage.ts`

```ts
export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;
```

덤으로 Supabase의 `PostgrestError`(`Error` 인스턴스가 아님)도 여기서 함께 다룰 수 있습니다. 지금 코드는 Postgrest 에러가 오면 전부 fallback 문구로 떨어집니다.

### 13. 가계부 가드 보일러플레이트 반복

> **진행 상황 (✅ 완료)** — `src/features/household/ui/HouseholdGuard.tsx`를 추가해 로딩/에러/빈 상태 문구, 에러 메시지 추출, `key={householdId}` 리마운트 리셋을 한 곳으로 모았습니다(렌더 프롭 `<HouseholdGuard>{(householdId) => ...}</HouseholdGuard>` 형태, `emptyMessage` prop으로 페이지별 문구 차이만 오버라이드). `home/index.tsx`, `calendar/index.tsx`, `history/index.tsx`, `write/index.tsx` 4개 파일 모두 적용했고, 부수적으로 calendar/history에 남아있던 `getErrorMessage` 미적용 구간(`householdError instanceof Error ? ... : '...'`, #12 리팩터 당시 변수명이 달라 누락됨)도 함께 정리됐습니다. 구조가 다른 `write/edit/index.tsx`(가계부 로딩 + 거래 로딩 + 가계부 불일치 체크가 얽혀 있음)는 원 제안대로 스코프에서 제외했습니다.

**근거** — `src/pages/calendar/index.tsx:184-213`, `home/index.tsx`, `history/index.tsx`, `write/index.tsx`가 모두 같은 모양입니다.

```tsx
const { householdId, isLoading, error } = useCurrentHousehold();
// → 로딩 문구 → 에러 문구 → "가계부를 선택해 주세요" → <Content key={householdId} />
```

**제안** — `src/features/household`에 `<HouseholdGuard>{(householdId) => ...}</HouseholdGuard>` 또는 `withHousehold()` HOC를 두고 4개 페이지에서 재사용. `key={householdId}`로 상태를 리셋하는 규칙도 한 곳에 모여 실수가 줄어듭니다.

### 14. FSD 레이어 규칙이 린트로 강제되지 않음

**근거** — `docs/overview.md`에 레이어 방향과 Public API 규칙이 명시돼 있고, 실제로 지금은 **위반이 0건**입니다 (역방향 import, 슬라이스 내부 deep import 모두 검출 안 됨). 다만 `eslint.config.mjs`에는 이를 막는 규칙이 없습니다.

**제안** — 규율이 잘 지켜지는 지금이 자동화하기 가장 좋은 시점입니다. `no-restricted-imports`로 레이어별 패턴을 막거나, `eslint-plugin-boundaries` / `steiger` 도입.

### 15. import 정렬 규칙 미적용

**근거** — `src/pages/login/ui/BrandHero.tsx:6` 에서 외부 패키지 import가 로컬 스타일 import 뒤에 있는데도 `pnpm lint`가 통과합니다.

**제안** — `eslint-plugin-import`의 `import/order` 또는 `@ianvs/prettier-plugin-sort-imports`. 나머지 파일은 이미 규칙대로 정렬돼 있어 도입 비용이 거의 없습니다.

---

## 🟠 성능

### 16. ECharts 전체 번들을 정적 import

> **진행 상황 (✅ 완료)** — 제안 1·2·3번 모두 적용했습니다.
> - **제안 3**: 로그인 페이지 `BrandHero`의 ECharts 텍스트 드로잉 애니메이션 제거, 기존 공식 로고 `MoaLogo`를 88px→144px로 확대해 대체(로그인 라우트 클라이언트 청크에서 `echarts` 완전히 빠짐, 빌드 청크 기준 확인).
> - **제안 1**: `src/shared/lib/echarts.ts`에 홈 대시보드가 실제로 쓰는 모듈만 등록(`BarChart`/`PieChart`/`ScatterChart` + `GridComponent`/`LegendComponent`/`TooltipComponent` + `CanvasRenderer`), 5개 카드 전부 `echarts-for-react` 전체 번들 대신 `echarts-for-react/lib/core` + 이 등록 모듈을 사용하도록 교체. 랜딩 `ProductChart`(`line` 차트)도 같은 방식으로 전환하되, **홈과 겹치지 않게 `src/pages/welcome/lib/echarts.ts`로 등록을 분리**했습니다 — 하나의 등록 모듈을 공유하면 webpack이 두 화면의 청크를 합쳐서 서로 안 쓰는 차트 타입까지 함께 받아가는 것을 빌드 산출물로 확인했기 때문입니다(`react-loadable-manifest.json` 기준 청크 크기 비교로 검증).
> - **제안 2**: 홈 대시보드 5개 카드(`CategoryPieCard`/`DailyExpenseCard`/`MetricRingCard`/`SpendingOverTimeCard`/`TopSpendingsCard`)를 `DashboardSection.tsx`에서 `next/dynamic(..., { ssr: false })`로 감싸 대시보드 진입 시에만 별도 청크로 로드하도록 변경(다른 라우트의 초기 HTML/청크에 echarts 참조가 없음을 확인).
> - 남는 것: zrender+echarts 코어 런타임 자체는 어떤 차트 타입을 쓰든 필요한 공통 비용(트리셰이킹으로 더 줄일 수 없는 부분)이라 홈/랜딩 청크 각각 500KB대(압축 전 기준, 실제 전송은 gzip으로 상당히 작아짐)를 차지합니다 — 이건 echarts를 계속 쓰는 한 남는 구조적 비용이며, 더 줄이려면 더 가벼운 차트 라이브러리로 교체하는 별도 논의가 필요합니다.

**근거** — `echarts-for-react`(→ `echarts` 전체)를 정적으로 가져오는 곳:

- 홈 대시보드 5개: `AssetTrendCard`, `SpendingOverTimeCard`, `CategoryPieCard`, `MetricRingCard`, `TopSpendingsCard`
- **로그인 페이지**: `src/pages/login/ui/BrandHero.tsx:6` — 장식용 텍스트 애니메이션 하나 때문에 차트 라이브러리 전체가 로그인 경로에 들어갑니다

랜딩(`src/pages/welcome/ui/ProductFrame.tsx:4`)만 `next/dynamic`으로 분리해 두었습니다.

**문제** — `echarts` 풀 번들은 압축 후에도 수백 KB입니다. 모바일에서 홈 화면에 설치해 쓰는 PWA에서 첫 진입 비용으로는 큽니다.

**제안**

1. `echarts/core` + 필요한 차트/컴포넌트/렌더러만 `echarts.use([...])`로 등록 (line/bar/pie + `CanvasRenderer`면 충분해 보입니다)
2. 홈 차트 카드들을 `next/dynamic(..., { ssr: false })`로 감싸 대시보드 진입 시 로드
3. `BrandHero`의 장식 애니메이션은 ECharts를 쓸 이유가 없어 보입니다 — SVG `stroke-dasharray` 애니메이션으로 대체하면 로그인 경로에서 라이브러리를 통째로 걷어낼 수 있습니다

### 17. 뮤테이션마다 `auth.getUser()` 네트워크 왕복

**근거** — 브라우저에서 `supabase.auth.getUser()`를 호출하는 곳 6군데: `useCreateTransaction.ts:23`, `useCreateSchedule.ts:20`, `useGetProfile.ts:17`, `useCreateProfile.ts:14`, `useCreateHousehold.ts:19`, `useCreateHouseholdInvite.ts:18`.

**문제** — `getUser()`는 로컬 캐시가 아니라 Supabase Auth 서버에 토큰 검증 요청을 보냅니다. "거래 저장" 한 번에 `getUser` → `insert` 두 번의 왕복이 생겨 체감 지연이 늘어납니다.

**제안** — `userId`를 TanStack Query로 한 번 캐싱(`useCurrentUser`)해 뮤테이션에서 재사용. 클라이언트 쓰기의 실제 권한 경계는 RLS이므로, 여기서 매번 서버 검증을 다시 할 이유는 없습니다.

> 참고: `createBrowserClient()` 호출이 34곳이지만 `@supabase/ssr`이 브라우저에서 싱글턴으로 캐싱하므로(`node_modules/@supabase/ssr/dist/main/createBrowserClient.js:9-16`) 성능 문제는 아닙니다. 반복 보일러플레이트라는 점만 남습니다.

### 18. 달력의 멤버 → 프로필 조회 워터폴

**근거** — `src/pages/calendar/model/useCalendarPage.ts:85-89`

```ts
const memberIds = useMemo(() => (membersQuery.data ?? []).map(m => m.userId), [...]);
const profilesQuery = useListProfilesByIds(memberIds);
```

**문제** — 달력 진입 시 7개 쿼리가 뜨는데, 프로필 조회는 멤버 조회가 끝나야 시작하는 직렬 구간입니다. 또 `listProfilesByIds`는 `.order()`가 없어 반환 순서가 보장되지 않습니다 (현재는 Map으로 변환해 쓰므로 무해).

**제안** — `household_members`에서 `select('*, profiles(*)')` 임베디드 조회로 한 번에 가져와 왕복을 줄이기.

### 19. `proxy.ts`가 매 요청 `auth.getUser()` 호출

**근거** — `proxy.ts:68`. matcher에 앱의 거의 모든 경로가 들어 있습니다.

**문제** — 모든 네비게이션에 Auth 서버 왕복이 하나 붙습니다.

**참고** — 이건 **의도된 트레이드오프**입니다. `getSession()`은 쿠키의 JWT를 검증 없이 읽으므로 인증 게이트로 쓰면 위험합니다. 지금 구현이 안전한 쪽이고, 최적화한다면 `moa_gate` 쿠키처럼 짧은 TTL 캐시를 두는 방향이지 `getUser()`를 걷어내는 방향은 아닙니다. 문서에 이 판단 근거를 남겨 두면 나중에 "느리다"는 이유로 잘못 바뀌는 걸 막을 수 있습니다.

---

## 🟡 정리 항목

### 20. 남아 있는 `console.log`

`src/pages/home/ui/CategoryPieCard.tsx:86`

```ts
console.log('legendselectchanged', params);
```

디버그 잔재로 보입니다. 제거하고, ESLint에 `no-console`(`warn`/`error`만 허용)을 추가해 재발 방지.

### 21. 멤버 색상이 배열 인덱스 기반

`src/pages/calendar/model/useCalendarPage.ts:99-103`

```ts
map[member.userId] = AUTHOR_COLORS[index % AUTHOR_COLORS.length];
```

멤버 목록은 `joinedAt` 오름차순이라 평소엔 안정적이지만, **누가 탈퇴하면 그 뒤 멤버들의 색이 전부 한 칸씩 밀립니다.** 사용자는 "내 일정 색이 갑자기 바뀌었다"고 느낍니다. `userId` 해시로 색을 고르거나, `household_members`에 `color` 컬럼을 두어 고정하는 편이 낫습니다.

### 22. 기타

- **`manifest.json`** — `id`, `scope`, `shortcuts`가 없습니다. `id`는 설치 아이덴티티 안정성에, `shortcuts`("작성", "달력")는 홈 화면 롱프레스 메뉴에 도움이 됩니다.
- **큰 파일** — `src/pages/welcome/ui/welcome.module.css`(1395줄), `calendar.module.css`(896줄)는 섹션별로 쪼갤 여지가 있습니다. TSX 쪽은 `ScheduleForm.tsx`(325줄), `TransactionForm.tsx`(313줄), `useCalendarPage.ts`(306줄)가 상위권이지만, 모두 응집도가 높아 지금 당장 급하진 않습니다.
- **`.env` 파일** — 로컬 작업 트리에 `.env`가 있습니다. `.gitignore`가 `.env*`를 막고 있어 커밋되진 않았지만, 관례상 `.env.local`로 옮기는 편이 Next.js 규약에 맞습니다.

---

## 권장 착수 순서

1. **#3 스키마·RLS 덤프** — 다른 모든 DB 작업의 전제이고, 지금이 가장 위험 노출이 큰 항목
2. **#1 반복 거래 부활 버그** — 사용자가 실제로 마주치는 데이터 오류
3. **#4 조회 절단 여부 확인** — 현재 `db-max-rows` 설정을 확인해서 이미 틀린 값을 보여주고 있는지부터 판정 (✅ 단기 제안 완료 — 무한 스크롤·서버 필터 적용, 중기 RPC 이관은 남음)
4. **#11 typecheck + 테스트 + CI 골격** — 이후 리팩터링의 안전망
5. ~~**#8 에러 경계**~~ (✅ 완료), **#10 env example** — 각각 30분 내외, 효과 대비 저렴
6. ~~**#16 번들 다이어트**~~ (✅ 완료) — PWA 체감 성능 개선폭이 큼
7. ~~**#12**~~ ~~**#13**~~ (✅ 완료) **~15 중복·규칙 자동화** — 리팩터링 여유가 생겼을 때 (#14, #15는 남음)
