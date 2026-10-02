-- 1:1 문의하기: 테이블, 제약, 인덱스, is_admin() 함수
-- 쓰기는 모두 RPC(SECURITY DEFINER)로만 수행하며, RLS/GRANT는 다음 마이그레이션에서 설정한다.

-- 운영자 목록 (SQL로 직접 등록: INSERT INTO admins ("userId") VALUES ('<auth.users.id>');)
CREATE TABLE IF NOT EXISTS admins (
  "userId" uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE "userId" = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO service_role;

-- FAQ
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  "helpfulCount" integer NOT NULL DEFAULT 0,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT faqs_category_check CHECK (
    category IN (
      'shared_household',
      'record_category',
      'stats_screen',
      'account_login',
      'bug_report',
      'feature_request',
      'other'
    )
  ),
  CONSTRAINT faqs_helpful_count_check CHECK ("helpfulCount" >= 0)
);

CREATE INDEX IF NOT EXISTS faqs_category_sort_order_idx
  ON faqs (category, "sortOrder");

-- 문의 (category NULL = 미분류)
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'waiting',
  category text,
  "categoryConfidence" numeric,
  "deviceInfo" jsonb,
  "assigneeId" uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  "hasUnreadReply" boolean NOT NULL DEFAULT false,
  rating smallint,
  "closeReason" text,
  "waitingSince" timestamptz NOT NULL DEFAULT now(),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inquiries_status_check CHECK (
    status IN ('waiting', 'in_progress', 'answered', 'closed')
  ),
  CONSTRAINT inquiries_category_check CHECK (
    category IS NULL OR category IN (
      'shared_household',
      'record_category',
      'stats_screen',
      'account_login',
      'bug_report',
      'feature_request',
      'other'
    )
  ),
  CONSTRAINT inquiries_confidence_check CHECK (
    "categoryConfidence" IS NULL
    OR ("categoryConfidence" >= 0 AND "categoryConfidence" <= 1)
  ),
  CONSTRAINT inquiries_rating_check CHECK (
    rating IS NULL OR (rating >= 1 AND rating <= 5)
  ),
  CONSTRAINT inquiries_title_length_check CHECK (
    char_length(title) BETWEEN 2 AND 50
  )
);

CREATE INDEX IF NOT EXISTS inquiries_user_created_at_idx
  ON inquiries ("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS inquiries_status_waiting_since_idx
  ON inquiries (status, "waitingSince");

CREATE INDEX IF NOT EXISTS inquiries_assignee_idx
  ON inquiries ("assigneeId")
  WHERE "assigneeId" IS NOT NULL;

-- 문의 메시지 (question: 사용자, reply: 운영자 답변, memo: 운영자 내부 메모)
CREATE TABLE IF NOT EXISTS "inquiry-messages" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "inquiryId" uuid NOT NULL REFERENCES inquiries (id) ON DELETE CASCADE,
  kind text NOT NULL,
  "authorId" uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  body text NOT NULL,
  attachments text[] NOT NULL DEFAULT '{}',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inquiry_messages_kind_check CHECK (
    kind IN ('question', 'reply', 'memo')
  ),
  CONSTRAINT inquiry_messages_attachments_check CHECK (
    cardinality(attachments) <= 3
  ),
  CONSTRAINT inquiry_messages_body_length_check CHECK (
    char_length(body) BETWEEN 1 AND 2000
  )
);

CREATE INDEX IF NOT EXISTS inquiry_messages_inquiry_created_at_idx
  ON "inquiry-messages" ("inquiryId", "createdAt");

-- 문의 이벤트 로그 (분류 정정, 상태 변경, 담당자 변경)
CREATE TABLE IF NOT EXISTS "inquiry-events" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "inquiryId" uuid NOT NULL REFERENCES inquiries (id) ON DELETE CASCADE,
  type text NOT NULL,
  "fromValue" text,
  "toValue" text,
  "actorId" uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inquiry_events_type_check CHECK (
    type IN ('status_change', 'assignee_change', 'category_change')
  )
);

CREATE INDEX IF NOT EXISTS inquiry_events_inquiry_created_at_idx
  ON "inquiry-events" ("inquiryId", "createdAt");
