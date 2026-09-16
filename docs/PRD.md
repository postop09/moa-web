# PRD — 모아(Moa)

그래프 중심의 공유 가계부 PWA. 한 가계부를 여러 명이 함께 쓰고, 수입·지출·저축·보험을 기록해 홈 대시보드에서 소비를 분석하며, 달력에서 일정과 지출을 같이 본다.

새 기능을 계획할 때는 이 문서에서 관련 요구사항을 먼저 찾는다. 없으면 이 문서에 항목을 추가한 뒤 작업을 시작한다. 구조·데이터 모델은 [ARCHITECTURE.md](./ARCHITECTURE.md), 인증 흐름은 [authOnboarding.md](./authOnboarding.md), 알려진 결함·개선 과제는 [improvements.md](./improvements.md)를 참고한다.

## 타깃 사용자

가계부를 배우자·가족·룸메이트 등과 공유해서 쓰는 사람. 모바일 우선(PWA로 홈 화면 설치), 한국어 UI, KST(Asia/Seoul) 기준 날짜.

## 용어

| 용어                           | 의미                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| 가계부 (household)             | 거래·일정·카테고리를 공유하는 단위. 한 사용자가 여러 가계부에 속할 수 있음             |
| 소유자 (owner) / 멤버 (member) | 가계부 내 역할. 소유자만 가계부 삭제·멤버 추방 가능                                    |
| 거래 (transaction)             | 수입/지출/저축/보험 중 하나의 기록                                                     |
| 반복 거래 템플릿               | `isRecurring=true, recurringSourceId=null`인 원본 거래. 매달 지정일에 사본을 자동 생성 |
| 자동 생성 사본                 | `recurringSourceId=템플릿 id`인 거래. 일반 거래로 취급되며 반복 토글 UI가 없음         |
| 일정 (schedule)                | 달력에 표시되는 이벤트. 거래와 별개                                                    |
| 일정 카테고리                  | 일정 분류용 색상 태그                                                                  |

## 핵심 기능 요구사항

### FR-ONBOARD — 온보딩·인증

- **FR-ONBOARD-1** Google OAuth로만 로그인한다 (`/login`).
- **FR-ONBOARD-2** 최초 로그인 시 닉네임을 입력해 프로필을 만든다 (`/onboarding/profile`).
- **FR-ONBOARD-3** 프로필 생성 후 가계부가 없으면 새로 만들거나(`/onboarding/household`), 초대 링크(`/invite/{token}`)를 통해 기존 가계부에 합류한다.
- **FR-ONBOARD-4** 온보딩 완료 여부는 쿠키(`moa_gate`)로 캐시해 재방문 시 DB를 다시 조회하지 않는다.
- 상세 상태 전이·리다이렉트 규칙은 [authOnboarding.md](./authOnboarding.md)가 단일 출처.

구현: [`src/pages/login`](../src/pages/login/), [`src/pages/createProfile`](../src/pages/createProfile/), [`src/pages/createHousehold`](../src/pages/createHousehold/), [`src/pages/acceptInvite`](../src/pages/acceptInvite/)

### FR-HOME — 홈 대시보드 (`/`)

월 단위로 가계부 현황을 카드형 차트로 보여준다.

| 카드                     | 내용                                                |
| ------------------------ | --------------------------------------------------- |
| `HouseholdPageTitle`     | 가계부 전환 드롭다운, 인라인 생성                   |
| `MonthNavigator`         | 이전/다음 달 이동. **현재 월 이후로는 이동 불가**   |
| `DashboardHeader`        | 잔액(수입 − 지출 − 저축 − 보험), 유형별 비율 스택바 |
| `MetricRingCard`         | 수입·지출·저축·보험 비율 도넛 4종                   |
| `CategoryPieCard`        | 지출 카테고리 비율 파이 차트                        |
| `TopSpendingsCard`       | 카테고리별 상위 지출 버블 차트                      |
| `SpendingOverTimeCard`   | 주간/월간 지출 추이 스택 막대 (기간 토글)           |
| `DailyExpenseCard`       | 선택한 달의 일별 지출 라인 차트                     |
| `CategoryBudgetCard`     | 카테고리별 예산 대비 사용률·초과 표시               |
| `RecentTransactionsCard` | 이번 달 최근 5건, 클릭 시 `/write/:id`로 이동       |

- **FR-HOME-1** 차트 카드(`CategoryPieCard`/`DailyExpenseCard`/`MetricRingCard`/`SpendingOverTimeCard`/`TopSpendingsCard`)는 ECharts로 렌더링하며 대시보드 진입 시에만 지연 로드한다.
- **FR-HOME-2** 가계부에 거래가 없으면 각 카드는 빈 상태 문구를 보여준다.

> 과거 문서에 있던 "자산 추이"(누적 자산 라인 차트) 카드는 **삭제되었다**. 조회 창(12개월) 밖의 잔액을 무시해 절대값을 오독시키는 문제가 있었고, 대안으로 `DailyExpenseCard`(일일 지출)로 교체됐다 — [improvements.md](./improvements.md) 참고.

구현: [`src/pages/home`](../src/pages/home/)

### FR-WRITE — 거래 작성·수정 (`/write`, `/write/[id]`)

| 필드      | 규칙                                                      |
| --------- | --------------------------------------------------------- |
| 유형      | 지출 / 수입 / 저축 / 보험 중 하나 (필수)                  |
| 금액      | 양의 정수 (필수)                                          |
| 날짜      | DatePicker로 선택 (필수)                                  |
| 카테고리  | 선택한 유형에 맞는 카테고리만 노출, 미선택 가능           |
| 이름      | 선택, 최대 80자                                           |
| 메모      | 선택, 최대 200자                                          |
| 반복 거래 | 토글 on 시 거래 날짜의 **일(day)** 이 매달 반복 기준이 됨 |

- **FR-WRITE-1** 반복 토글은 템플릿(원본)에만 노출되고, 자동 생성 사본에는 노출되지 않는다.
- **FR-WRITE-2** 반복일이 그 달에 없는 날짜(예: 31일)면 그 달의 말일로 보정한다.

구현: [`src/pages/write`](../src/pages/write/) (수정 화면은 [`src/pages/write/edit`](../src/pages/write/edit/)), 배치 로직은 [ARCHITECTURE.md의 반복 거래 인프라](./ARCHITECTURE.md#반복-거래-인프라) 참고.

### FR-HISTORY — 거래 내역 (`/history`)

| 기능      | 설명                                                             |
| --------- | ---------------------------------------------------------------- |
| 필터      | 유형(전체/수입/지출/저축/보험), 카테고리, 월 선택 또는 전체 기간 |
| 합계      | 유형별 합계. 전체 유형 필터일 때는 잔액도 표시                   |
| 목록      | 모바일은 카드, 데스크톱은 테이블 레이아웃                        |
| 반복 뱃지 | 템플릿과 자동 생성 사본 모두에 "반복" 표시                       |
| 수정      | 항목 클릭 시 `/write/:id`로 이동                                 |

- **FR-HISTORY-1** 무한 스크롤로 목록을 페이지 단위(월 선택 모드 500건/전체 기간 모드 50건)로 불러온다.

구현: [`src/pages/history`](../src/pages/history/)

### FR-CALENDAR — 달력 (`/calendar`)

| 기능             | 설명                                                                                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 월간 그리드      | 일정을 레인으로 배치, 날짜별 지출 합계 표시                                                                                                                                                                                           |
| 이동             | 좌우 스와이프 또는 버튼으로 월/연 단위 이동                                                                                                                                                                                           |
| 필터             | 지출 표시 on/off, 작성자별, 일정 카테고리별                                                                                                                                                                                           |
| 일 상세 패널     | 선택일의 일정·지출 목록, 일정 추가 진입점                                                                                                                                                                                             |
| 일정 CRUD        | 제목, 시작/종료 날짜·시간, 메모, 카테고리                                                                                                                                                                                             |
| 일정 카테고리    | 이름 + 색상 지정, CRUD                                                                                                                                                                                                                |
| 주말·공휴일 표시 | 토·일 요일 헤더와 그리드 날짜 숫자를 빨간색으로 강조, 셀과 그 아래 일정 바 영역까지 열 전체에 옅은 붉은 배경 틴트, 일 상세 패널 제목에 공휴일명 표시. 전/다음 달 패딩 날짜도 주말·공휴일이면 배경 틴트를 받되 숫자는 흐린 회색을 유지 |
| 날짜 그리드 격자 | 날짜 셀과 일정 바 영역을 간격 없이 배치하고 옅은 회색 격자선(세로·가로 모두)으로 구분                                                                                                                                                 |

- **FR-CALENDAR-1** 멤버별 색상은 가계부 멤버 목록 순서를 인덱스로 배정한다 — 멤버가 탈퇴하면 이후 멤버들의 색이 밀리는 알려진 한계가 있다 ([improvements.md](./improvements.md) 참고).
- **FR-CALENDAR-2** 공휴일 데이터는 `@hyunbinseo/holidays-kr`(공식 월력요항 기반, 대체·임시공휴일 포함) 패키지의 정적 데이터를 쓴다. 특정 연도까지만 데이터가 있으므로(현재 2018~2027년) 매년 `pnpm update`로 최신화가 필요하다.
- **FR-CALENDAR-3** 주말·공휴일 배경 틴트는 이번 달과 전/다음 달 패딩 날짜 모두에 적용한다. 다만 날짜 숫자 색상(빨간 글씨)은 이번 달 날짜(`inMonth`)에만 적용하고, 패딩 날짜는 흐린 회색을 유지한다 — 이 조합은 20% 배경 틴트 위에서 대비가 1.55:1로 WCAG AA(4.5:1) 미달이지만, "이번 달이 아님"이라는 정보가 더 중요하다고 판단해 의도적으로 허용한 트레이드오프다. 셀 배경은 항상 `--color-surface` 기준으로 합성해 격자선 색과 섞이지 않도록 한다(재사용 시 배경이 달라지면 대비 재검증 필요).

구현: [`src/pages/calendar`](../src/pages/calendar/)

### FR-SETTINGS — 설정 (`/settings`)

| 섹션     | 기능                                                                                |
| -------- | ----------------------------------------------------------------------------------- |
| 계정     | 닉네임·이메일 표시, 로그아웃                                                        |
| 멤버     | 목록(소유자/멤버 역할 표시), 이메일 초대, 대기 중 초대 취소, 멤버 추방(소유자만)    |
| 카테고리 | 유형별 CRUD, 예산 설정                                                              |
| 가계부   | 소유자는 삭제, 멤버는 나가기. 마지막 가계부를 잃으면 `/onboarding/household`로 유도 |

구현: [`src/pages/settings`](../src/pages/settings/)

### FR-MARKETING — 랜딩·가이드·약관 (비로그인 공개 페이지)

| 경로                      | 내용                                                                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/welcome`                | 히어로, 하이라이트, 스크롤 연동 가계부 미리보기(`ProductChart`/`ProductFrame`), 공유 가계부 안내, 달력 가이드, PWA 설치 가이드, CTA |
| `/guide`, `/guide/[slug]` | 사용 가이드 아티클 목록·상세 (초대하기/초대 수락하기/소유자·멤버 권한/작성자 보기, `src/pages/guide/config/articles/`)              |
| `/privacy`, `/terms`      | 개인정보처리방침, 이용약관                                                                                                          |

이 그룹의 라우트는 SEO 대상이며 metadata·JSON-LD·sitemap 등록이 필수다 — [ARCHITECTURE.md](./ARCHITECTURE.md) 참고.

구현: [`src/pages/welcome`](../src/pages/welcome/), [`src/pages/guide`](../src/pages/guide/), [`src/pages/legal`](../src/pages/legal/)

### FR-NAV — 앱 네비게이션

하단 탭(모바일)/사이드바(데스크톱) 4개: **홈**(`/`), **내역**(`/history`), **달력**(`/calendar`), **설정**(`/settings`) — [`src/shared/config/navItems.ts`](../src/shared/config/navItems.ts). 거래 작성은 FAB 버튼 또는 `/write` 직접 접근으로 진입한다.

### FR-PWA — PWA 설치

홈 화면에 설치해 앱처럼 쓸 수 있다. `@ducanh2912/next-pwa` 기반, `public/manifest.json`. 설치 유도 프롬프트는 [`src/features/pwaInstall`](../src/features/pwaInstall/)가 담당하며 `/welcome`에 설치 가이드 섹션이 있다.

## 비기능 요구사항

- **언어**: UI는 한국어 전용. `<html lang="ko">`.
- **디바이스**: 모바일 우선 반응형. PWA로 설치 가능해야 한다.
- **시간대**: 반복 거래 배치·날짜 경계 계산은 KST(Asia/Seoul) 기준. 단, 클라이언트 UI의 로컬 날짜 표시는 브라우저 타임존을 쓴다 — 해외 사용자에게는 경계가 어긋날 수 있는 알려진 한계 ([improvements.md](./improvements.md)).
- **접근성**: WCAG 2.2 AA를 지향한다. 전용 리뷰어(`.claude/agents/a11y-reviewer.md`)가 UI 변경마다 점검한다.
- **보안**: 가계부 간 데이터 격리는 Supabase RLS에 의존한다(클라이언트가 publishable 키로 직접 테이블에 접근).
- **콜드 스타트**: 설치형 PWA를 완전히 종료한 뒤 다시 실행해도(iOS standalone 포함) 로그인·온보딩이 끝난 사용자는 리다이렉트 없이 `/`가 한 번의 요청으로 응답해야 하며, 마지막으로 본 대시보드는 네트워크 응답 전에 기기 캐시(24시간, 로그아웃 시 삭제)로 즉시 그려진 뒤 백그라운드에서 갱신된다. 데이터가 없을 때는 텍스트 대신 레이아웃과 같은 모양의 스켈레톤을 보여주고, iOS 스플래시는 주요 iPhone·iPad 해상도를 모두 커버한다.

## 범위 밖 / 미결정

- 다크 모드 — 디자인 토큰에 다크 테마 정의 없음
- 다국어(i18n)
- 오프라인 쓰기(PWA는 설치만 지원, 오프라인 데이터 동기화는 없음)
- 예산 초과 알림(푸시/이메일)
- 통계 전용 화면 — `/stats` 라우트는 현재 `redirect('/history')`만 하는 스텁이다 ([`app/(app)/stats/page.tsx`](<../app/(app)/stats/page.tsx>))
