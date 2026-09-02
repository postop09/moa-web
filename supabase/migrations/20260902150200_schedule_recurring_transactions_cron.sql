-- pg_cron으로 매일 00:05 KST(=15:05 UTC) 반복 거래 자동 생성

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'generate-recurring-transactions'
  ) THEN
    PERFORM cron.unschedule('generate-recurring-transactions');
  END IF;
END;
$$;

SELECT cron.schedule(
  'generate-recurring-transactions',
  '5 15 * * *',
  $$SELECT public.generate_recurring_transactions()$$
);
