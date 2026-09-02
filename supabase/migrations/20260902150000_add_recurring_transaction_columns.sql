-- 반복 거래: 매달 지정일 자동 생성을 위한 컬럼 추가

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS "recurringDay" smallint,
  ADD COLUMN IF NOT EXISTS "recurringSourceId" bigint;

ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_recurring_day_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_recurring_day_check
  CHECK ("recurringDay" IS NULL OR ("recurringDay" >= 1 AND "recurringDay" <= 31));

ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_recurring_source_id_fkey;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_recurring_source_id_fkey
  FOREIGN KEY ("recurringSourceId") REFERENCES transactions (id) ON DELETE SET NULL;

-- 기존 반복 거래 템플릿에 반복일 백필 (거래일 기준 KST)
UPDATE transactions
SET "recurringDay" = EXTRACT(
  day FROM ("transactionDt" AT TIME ZONE 'Asia/Seoul')
)::smallint
WHERE "isRecurring" = true
  AND "recurringDay" IS NULL
  AND "recurringSourceId" IS NULL;

-- 월별 중복 생성 방지 (자동 생성 사본만 대상)
CREATE UNIQUE INDEX IF NOT EXISTS transactions_recurring_source_month_unique
  ON transactions (
    "recurringSourceId",
  (date_trunc('month', "transactionDt" AT TIME ZONE 'Asia/Seoul'))
  )
  WHERE "recurringSourceId" IS NOT NULL;
