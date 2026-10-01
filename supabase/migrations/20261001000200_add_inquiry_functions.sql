-- 1:1 문의하기 RPC (상태 전이·소유권·입력 검증을 DB에서 강제)
-- 모든 사용자 식별은 auth.uid()로만 한다. 클라이언트가 보낸 사용자 id는 신뢰하지 않는다.
-- 오류는 RAISE EXCEPTION '<코드>' 로 던진다:
--   unauthorized, forbidden, not_found, invalid_state, conflict,
--   invalid_title, invalid_body, invalid_attachments, invalid_category,
--   invalid_confidence, invalid_rating, invalid_status, invalid_assignee,
--   invalid_device_info, uncategorized, already_rated
-- 제목/본문/사유의 앞뒤 공백 제거는 클라이언트와 동일하게 space, tab, CR, LF 만 대상으로 한다.

-- 내부 헬퍼: 첨부 경로 검증 (최대 3개, p_owner 지정 시 해당 사용자 폴더만 허용)
CREATE OR REPLACE FUNCTION inquiry_normalize_attachments(
  p_attachments text[],
  p_owner uuid
)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_path text;
  v_result text[] := COALESCE(p_attachments, '{}');
BEGIN
  IF cardinality(v_result) > 3 THEN
    RAISE EXCEPTION 'invalid_attachments';
  END IF;

  FOREACH v_path IN ARRAY v_result LOOP
    IF v_path IS NULL
       OR btrim(v_path) = ''
       OR v_path LIKE '%..%'
       OR (p_owner IS NOT NULL AND v_path NOT LIKE p_owner::text || '/%') THEN
      RAISE EXCEPTION 'invalid_attachments';
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$;

-- 내부 헬퍼: 이벤트 로그 기록
CREATE OR REPLACE FUNCTION inquiry_log_event(
  p_inquiry_id uuid,
  p_type text,
  p_from text,
  p_to text,
  p_actor uuid
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO "inquiry-events" ("inquiryId", type, "fromValue", "toValue", "actorId")
  VALUES (p_inquiry_id, p_type, p_from, p_to, p_actor);
$$;

REVOKE ALL ON FUNCTION inquiry_normalize_attachments(text[], uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION inquiry_log_event(uuid, text, text, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION inquiry_normalize_attachments(text[], uuid) TO service_role;
GRANT EXECUTE ON FUNCTION inquiry_log_event(uuid, text, text, text, uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 사용자 RPC
-- ---------------------------------------------------------------------------

-- 문의 접수: 문의 + 첫 메시지 생성 (category NULL이면 미분류)
CREATE OR REPLACE FUNCTION create_inquiry(
  p_title text,
  p_body text,
  p_category text,
  p_confidence numeric,
  p_device_info jsonb,
  p_attachments text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_title text := btrim(COALESCE(p_title, ''), E' \t\r\n');
  v_body text := btrim(COALESCE(p_body, ''), E' \t\r\n');
  v_attachments text[];
  v_inquiry_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF char_length(v_title) < 2 OR char_length(v_title) > 50 THEN
    RAISE EXCEPTION 'invalid_title';
  END IF;
  IF char_length(v_body) < 10 OR char_length(v_body) > 2000 THEN
    RAISE EXCEPTION 'invalid_body';
  END IF;
  IF p_category IS NOT NULL AND p_category NOT IN (
    'shared_household', 'record_category', 'stats_screen',
    'account_login', 'bug_report', 'feature_request', 'other'
  ) THEN
    RAISE EXCEPTION 'invalid_category';
  END IF;
  IF p_confidence IS NOT NULL AND (p_confidence < 0 OR p_confidence > 1) THEN
    RAISE EXCEPTION 'invalid_confidence';
  END IF;
  IF p_device_info IS NOT NULL AND (
    jsonb_typeof(p_device_info) <> 'object'
    OR pg_column_size(p_device_info) > 4096
  ) THEN
    RAISE EXCEPTION 'invalid_device_info';
  END IF;

  v_attachments := inquiry_normalize_attachments(p_attachments, v_uid);

  INSERT INTO inquiries ("userId", title, category, "categoryConfidence", "deviceInfo")
  VALUES (
    v_uid,
    v_title,
    p_category,
    CASE WHEN p_category IS NULL THEN NULL ELSE p_confidence END,
    p_device_info
  )
  RETURNING id INTO v_inquiry_id;

  INSERT INTO "inquiry-messages" ("inquiryId", kind, "authorId", body, attachments)
  VALUES (v_inquiry_id, 'question', v_uid, v_body, v_attachments);

  RETURN v_inquiry_id;
END;
$$;

-- 문의 수정: 답변 대기(waiting) 상태이고 답변(reply)이 한 번도 없을 때만, 첫 질문 메시지도 함께 수정
-- "updatedAt" 을 갱신하므로 admin_reply_inquiry 의 충돌 검사로 수정 여부를 감지할 수 있다.
CREATE OR REPLACE FUNCTION update_inquiry(
  p_inquiry_id uuid,
  p_title text,
  p_body text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_title text := btrim(COALESCE(p_title, ''), E' \t\r\n');
  v_body text := btrim(COALESCE(p_body, ''), E' \t\r\n');
  v_status text;
  v_first_message_id uuid;
  v_has_reply boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF char_length(v_title) < 2 OR char_length(v_title) > 50 THEN
    RAISE EXCEPTION 'invalid_title';
  END IF;
  IF char_length(v_body) < 10 OR char_length(v_body) > 2000 THEN
    RAISE EXCEPTION 'invalid_body';
  END IF;

  SELECT status INTO v_status
  FROM inquiries
  WHERE id = p_inquiry_id AND "userId" = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF v_status <> 'waiting' THEN
    RAISE EXCEPTION 'invalid_state';
  END IF;

  -- 답변이 한 번이라도 달린 문의는 수정 불가 (삭제만 가능)
  SELECT EXISTS (
    SELECT 1 FROM "inquiry-messages"
    WHERE "inquiryId" = p_inquiry_id AND kind = 'reply'
  ) INTO v_has_reply;
  IF v_has_reply THEN
    RAISE EXCEPTION 'invalid_state';
  END IF;

  SELECT id INTO v_first_message_id
  FROM "inquiry-messages"
  WHERE "inquiryId" = p_inquiry_id AND kind = 'question'
  ORDER BY "createdAt", id
  LIMIT 1;

  UPDATE inquiries
  SET title = v_title, "updatedAt" = now()
  WHERE id = p_inquiry_id;

  UPDATE "inquiry-messages"
  SET body = v_body
  WHERE id = v_first_message_id;
END;
$$;

-- 추가 문의: answered -> waiting, 대기 시작 시각 갱신, 새 답변 표시 해제
CREATE OR REPLACE FUNCTION add_inquiry_follow_up(
  p_inquiry_id uuid,
  p_body text,
  p_attachments text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_body text := btrim(COALESCE(p_body, ''), E' \t\r\n');
  v_status text;
  v_attachments text[];
  v_message_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF char_length(v_body) < 10 OR char_length(v_body) > 2000 THEN
    RAISE EXCEPTION 'invalid_body';
  END IF;
  v_attachments := inquiry_normalize_attachments(p_attachments, v_uid);

  SELECT status INTO v_status
  FROM inquiries
  WHERE id = p_inquiry_id AND "userId" = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF v_status <> 'answered' THEN
    RAISE EXCEPTION 'invalid_state';
  END IF;

  INSERT INTO "inquiry-messages" ("inquiryId", kind, "authorId", body, attachments)
  VALUES (p_inquiry_id, 'question', v_uid, v_body, v_attachments)
  RETURNING id INTO v_message_id;

  UPDATE inquiries
  SET status = 'waiting',
      "waitingSince" = now(),
      "hasUnreadReply" = false,
      "updatedAt" = now()
  WHERE id = p_inquiry_id;

  PERFORM inquiry_log_event(p_inquiry_id, 'status_change', v_status, 'waiting', v_uid);

  RETURN v_message_id;
END;
$$;

-- 해결됐어요: answered -> closed
CREATE OR REPLACE FUNCTION close_inquiry(p_inquiry_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_status text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT status INTO v_status
  FROM inquiries
  WHERE id = p_inquiry_id AND "userId" = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF v_status <> 'answered' THEN
    RAISE EXCEPTION 'invalid_state';
  END IF;

  UPDATE inquiries
  SET status = 'closed',
      "hasUnreadReply" = false,
      "updatedAt" = now()
  WHERE id = p_inquiry_id;

  PERFORM inquiry_log_event(p_inquiry_id, 'status_change', v_status, 'closed', v_uid);
END;
$$;

-- 만족도 별점: 1~5, 문의당 1회, 답변을 받은 뒤(answered/closed)에만 가능
-- 추가로 운영자 답변(kind='reply')이 실제로 존재해야 한다 (운영자 종결 등 답변 없이 closed 된 문의는 평가 불가 -> invalid_state)
CREATE OR REPLACE FUNCTION rate_inquiry(
  p_inquiry_id uuid,
  p_rating smallint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_status text;
  v_rating smallint;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'invalid_rating';
  END IF;

  SELECT status, rating INTO v_status, v_rating
  FROM inquiries
  WHERE id = p_inquiry_id AND "userId" = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF v_status NOT IN ('answered', 'closed') THEN
    RAISE EXCEPTION 'invalid_state';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "inquiry-messages"
    WHERE "inquiryId" = p_inquiry_id AND kind = 'reply'
  ) THEN
    RAISE EXCEPTION 'invalid_state';
  END IF;
  IF v_rating IS NOT NULL THEN
    RAISE EXCEPTION 'already_rated';
  END IF;

  UPDATE inquiries
  SET rating = p_rating, "updatedAt" = now()
  WHERE id = p_inquiry_id;
END;
$$;

-- 읽음 처리: 새 답변 표시 해제 (본인 문의가 아니면 아무 일도 하지 않음)
CREATE OR REPLACE FUNCTION mark_inquiry_read(p_inquiry_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  UPDATE inquiries
  SET "hasUnreadReply" = false
  WHERE id = p_inquiry_id
    AND "userId" = v_uid
    AND "hasUnreadReply" = true;
END;
$$;

-- FAQ "도움이 됐어요" 투표: 사용자당 FAQ 1회만 집계 (테이블은 RPC 전용, 직접 권한 없음)
CREATE TABLE IF NOT EXISTS "faq-helpful-votes" (
  "faqId" uuid NOT NULL REFERENCES faqs (id) ON DELETE CASCADE,
  "userId" uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("faqId", "userId")
);

ALTER TABLE "faq-helpful-votes" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "faq-helpful-votes" FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE "faq-helpful-votes" TO service_role;

-- FAQ "도움이 됐어요" 집계
CREATE OR REPLACE FUNCTION increment_faq_helpful(p_faq_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_inserted integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM faqs WHERE id = p_faq_id) THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  INSERT INTO "faq-helpful-votes" ("faqId", "userId")
  VALUES (p_faq_id, v_uid)
  ON CONFLICT ("faqId", "userId") DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- 이미 투표한 사용자의 중복 호출은 집계에 반영하지 않는다
  IF v_inserted > 0 THEN
    UPDATE faqs
    SET "helpfulCount" = "helpfulCount" + 1
    WHERE id = p_faq_id;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 어드민 RPC (모두 is_admin() 필요)
-- ---------------------------------------------------------------------------

-- 상세 진입: waiting 이면 in_progress 로 바꾸고 자신을 담당자로 지정
CREATE OR REPLACE FUNCTION admin_open_inquiry(p_inquiry_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_status text;
  v_assignee uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT status, "assigneeId" INTO v_status, v_assignee
  FROM inquiries
  WHERE id = p_inquiry_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  IF v_status = 'waiting' THEN
    UPDATE inquiries
    SET status = 'in_progress',
        "assigneeId" = v_uid,
        "updatedAt" = now()
    WHERE id = p_inquiry_id;

    PERFORM inquiry_log_event(p_inquiry_id, 'status_change', 'waiting', 'in_progress', v_uid);
    IF v_assignee IS DISTINCT FROM v_uid THEN
      PERFORM inquiry_log_event(
        p_inquiry_id, 'assignee_change', v_assignee::text, v_uid::text, v_uid
      );
    END IF;
  END IF;
END;
$$;

-- 답변 등록: 마지막 (메모 제외) 메시지가 기대값과 다르거나, 기대 시각 이후 문의가 수정됐으면 'conflict'
-- 첨부는 문의 작성자 폴더({userId}/...) 아래 경로만 허용한다 (사용자는 본인 폴더만 읽을 수 있음).
-- 시그니처 변경: 이전 4개 인자 버전은 제거한다.
DROP FUNCTION IF EXISTS admin_reply_inquiry(uuid, text, text[], uuid);
CREATE OR REPLACE FUNCTION admin_reply_inquiry(
  p_inquiry_id uuid,
  p_body text,
  p_attachments text[],
  p_expected_last_message_id uuid,
  p_expected_updated_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_body text := btrim(COALESCE(p_body, ''), E' \t\r\n');
  v_attachments text[];
  v_status text;
  v_category text;
  v_assignee uuid;
  v_owner uuid;
  v_updated_at timestamptz;
  v_last_message_id uuid;
  v_message_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF char_length(v_body) < 1 OR char_length(v_body) > 2000 THEN
    RAISE EXCEPTION 'invalid_body';
  END IF;

  SELECT status, category, "assigneeId", "userId", "updatedAt"
  INTO v_status, v_category, v_assignee, v_owner, v_updated_at
  FROM inquiries
  WHERE id = p_inquiry_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF v_status = 'closed' THEN
    RAISE EXCEPTION 'invalid_state';
  END IF;
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'uncategorized';
  END IF;

  v_attachments := inquiry_normalize_attachments(p_attachments, v_owner);

  SELECT id INTO v_last_message_id
  FROM "inquiry-messages"
  WHERE "inquiryId" = p_inquiry_id AND kind <> 'memo'
  ORDER BY "createdAt" DESC, id DESC
  LIMIT 1;

  IF v_last_message_id IS DISTINCT FROM p_expected_last_message_id
     OR p_expected_updated_at IS NULL
     OR v_updated_at > p_expected_updated_at THEN
    RAISE EXCEPTION 'conflict';
  END IF;

  INSERT INTO "inquiry-messages" ("inquiryId", kind, "authorId", body, attachments)
  VALUES (p_inquiry_id, 'reply', v_uid, v_body, v_attachments)
  RETURNING id INTO v_message_id;

  UPDATE inquiries
  SET status = 'answered',
      "hasUnreadReply" = true,
      "assigneeId" = COALESCE("assigneeId", v_uid),
      "updatedAt" = now()
  WHERE id = p_inquiry_id;

  IF v_status <> 'answered' THEN
    PERFORM inquiry_log_event(p_inquiry_id, 'status_change', v_status, 'answered', v_uid);
  END IF;
  IF v_assignee IS NULL THEN
    PERFORM inquiry_log_event(p_inquiry_id, 'assignee_change', NULL, v_uid::text, v_uid);
  END IF;

  RETURN v_message_id;
END;
$$;

-- 내부 메모 (사용자에게 노출되지 않음)
CREATE OR REPLACE FUNCTION admin_add_memo(
  p_inquiry_id uuid,
  p_body text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_body text := btrim(COALESCE(p_body, ''), E' \t\r\n');
  v_message_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF char_length(v_body) < 1 OR char_length(v_body) > 2000 THEN
    RAISE EXCEPTION 'invalid_body';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM inquiries WHERE id = p_inquiry_id) THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  INSERT INTO "inquiry-messages" ("inquiryId", kind, "authorId", body)
  VALUES (p_inquiry_id, 'memo', v_uid, v_body)
  RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$;

-- 상태·담당자·카테고리 변경. NULL 인자는 "변경 없음"이며, 변경 항목마다 이벤트를 기록한다.
-- 상태는 waiting/in_progress 로만 바꿀 수 있고(종결은 admin_close_inquiry), 종결된 문의는 변경 불가.
CREATE OR REPLACE FUNCTION admin_update_inquiry_meta(
  p_inquiry_id uuid,
  p_status text,
  p_assignee_id uuid,
  p_category text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_old_status text;
  v_old_assignee uuid;
  v_old_category text;
  v_new_status text;
  v_waiting_since timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_status IS NOT NULL AND p_status NOT IN ('waiting', 'in_progress') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;
  IF p_category IS NOT NULL AND p_category NOT IN (
    'shared_household', 'record_category', 'stats_screen',
    'account_login', 'bug_report', 'feature_request', 'other'
  ) THEN
    RAISE EXCEPTION 'invalid_category';
  END IF;
  IF p_assignee_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM admins WHERE "userId" = p_assignee_id) THEN
    RAISE EXCEPTION 'invalid_assignee';
  END IF;

  SELECT status, "assigneeId", category, "waitingSince"
  INTO v_old_status, v_old_assignee, v_old_category, v_waiting_since
  FROM inquiries
  WHERE id = p_inquiry_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF v_old_status = 'closed' THEN
    RAISE EXCEPTION 'invalid_state';
  END IF;

  v_new_status := COALESCE(p_status, v_old_status);

  -- answered -> waiting 으로 되돌리면 대기 시간을 다시 센다
  IF v_old_status = 'answered' AND v_new_status = 'waiting' THEN
    v_waiting_since := now();
  END IF;

  UPDATE inquiries
  SET status = v_new_status,
      "assigneeId" = COALESCE(p_assignee_id, "assigneeId"),
      category = COALESCE(p_category, category),
      "waitingSince" = v_waiting_since,
      "updatedAt" = now()
  WHERE id = p_inquiry_id;

  IF v_new_status <> v_old_status THEN
    PERFORM inquiry_log_event(p_inquiry_id, 'status_change', v_old_status, v_new_status, v_uid);
  END IF;
  IF p_assignee_id IS NOT NULL AND p_assignee_id IS DISTINCT FROM v_old_assignee THEN
    PERFORM inquiry_log_event(
      p_inquiry_id, 'assignee_change', v_old_assignee::text, p_assignee_id::text, v_uid
    );
  END IF;
  IF p_category IS NOT NULL AND p_category IS DISTINCT FROM v_old_category THEN
    PERFORM inquiry_log_event(p_inquiry_id, 'category_change', v_old_category, p_category, v_uid);
  END IF;
END;
$$;

-- 운영자 종결 (사유 필수, 최대 500자)
CREATE OR REPLACE FUNCTION admin_close_inquiry(
  p_inquiry_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_reason text := btrim(COALESCE(p_reason, ''), E' \t\r\n');
  v_status text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF char_length(v_reason) < 1 OR char_length(v_reason) > 500 THEN
    RAISE EXCEPTION 'invalid_body';
  END IF;

  SELECT status INTO v_status
  FROM inquiries
  WHERE id = p_inquiry_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF v_status = 'closed' THEN
    RAISE EXCEPTION 'invalid_state';
  END IF;

  UPDATE inquiries
  SET status = 'closed',
      "closeReason" = v_reason,
      "assigneeId" = COALESCE("assigneeId", v_uid),
      "updatedAt" = now()
  WHERE id = p_inquiry_id;

  PERFORM inquiry_log_event(p_inquiry_id, 'status_change', v_status, 'closed', v_uid);
END;
$$;

-- ---------------------------------------------------------------------------
-- 실행 권한: PUBLIC/anon 회수 후 로그인 사용자와 service_role 에만 부여
-- (어드민 여부는 각 함수 내부에서 is_admin() 으로 검사)
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION create_inquiry(text, text, text, numeric, jsonb, text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION update_inquiry(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION add_inquiry_follow_up(uuid, text, text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION close_inquiry(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION rate_inquiry(uuid, smallint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION mark_inquiry_read(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION increment_faq_helpful(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION admin_open_inquiry(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION admin_reply_inquiry(uuid, text, text[], uuid, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION admin_add_memo(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION admin_update_inquiry_meta(uuid, text, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION admin_close_inquiry(uuid, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION create_inquiry(text, text, text, numeric, jsonb, text[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_inquiry(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION add_inquiry_follow_up(uuid, text, text[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION close_inquiry(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION rate_inquiry(uuid, smallint) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_inquiry_read(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_faq_helpful(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_open_inquiry(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_reply_inquiry(uuid, text, text[], uuid, timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_add_memo(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_update_inquiry_meta(uuid, text, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_close_inquiry(uuid, text) TO authenticated, service_role;
