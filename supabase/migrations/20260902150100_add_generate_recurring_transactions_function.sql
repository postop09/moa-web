-- 반복 거래 자동 생성 함수 (매달 지정일, KST 기준)

CREATE OR REPLACE FUNCTION generate_recurring_transactions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  template RECORD;
  month_cursor date;
  today_kst date;
  target_day int;
  last_day_of_month int;
  target_date date;
  target_ts timestamptz;
  start_month date;
  end_month date;
  inserted_count integer := 0;
BEGIN
  today_kst := (NOW() AT TIME ZONE 'Asia/Seoul')::date;
  end_month := date_trunc('month', today_kst)::date;

  FOR template IN
    SELECT *
    FROM transactions
    WHERE "isRecurring" = true
      AND "recurringDay" IS NOT NULL
      AND "recurringSourceId" IS NULL
  LOOP
    start_month := (
      date_trunc(
        'month',
        (template."transactionDt" AT TIME ZONE 'Asia/Seoul')::date
      ) + INTERVAL '1 month'
    )::date;

    month_cursor := start_month;

    WHILE month_cursor <= end_month LOOP
      last_day_of_month := EXTRACT(
        day FROM (month_cursor + INTERVAL '1 month' - INTERVAL '1 day')
      )::int;
      target_day := LEAST(template."recurringDay", last_day_of_month);
      target_date := (month_cursor + (target_day - 1) * INTERVAL '1 day')::date;

      IF target_date <= today_kst THEN
        IF NOT EXISTS (
          SELECT 1
          FROM transactions child
          WHERE child."recurringSourceId" = template.id
            AND date_trunc(
              'month',
              child."transactionDt" AT TIME ZONE 'Asia/Seoul'
            ) = date_trunc('month', month_cursor)
        ) THEN
          target_ts := make_timestamptz(
            EXTRACT(year FROM target_date)::int,
            EXTRACT(month FROM target_date)::int,
            EXTRACT(day FROM target_date)::int,
            12,
            0,
            0,
            'Asia/Seoul'
          );

          INSERT INTO transactions (
            "householdId",
            type,
            name,
            amount,
            "isRecurring",
            "categoryId",
            memo,
            "createdBy",
            "transactionDt",
            "recurringSourceId"
          ) VALUES (
            template."householdId",
            template.type,
            template.name,
            template.amount,
            false,
            template."categoryId",
            template.memo,
            template."createdBy",
            target_ts,
            template.id
          );

          inserted_count := inserted_count + 1;
        END IF;
      END IF;

      month_cursor := (month_cursor + INTERVAL '1 month')::date;
    END LOOP;
  END LOOP;

  RETURN inserted_count;
END;
$$;

REVOKE ALL ON FUNCTION generate_recurring_transactions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_recurring_transactions() TO postgres;
GRANT EXECUTE ON FUNCTION generate_recurring_transactions() TO service_role;
