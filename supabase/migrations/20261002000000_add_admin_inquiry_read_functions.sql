-- 1:1 문의하기: 어드민 조회용 RPC (SECURITY DEFINER)
--
-- 배경: 사용자와 운영자는 같은 롤(authenticated)이라 사용자용 컬럼 GRANT 가 운영자에게도 적용된다.
-- inquiries 의 "closeReason" / "categoryConfidence" / "assigneeId" 와 inquiry-messages 의 "authorId" 는
-- 테이블을 직접 SELECT 할 수 없으므로, 운영자 화면은 아래 함수로만 읽는다.
--
-- 공통 규칙
--  - 모든 함수는 시작 시 auth.uid() IS NULL 이면 'unauthorized', is_admin() 이 아니면 'forbidden' 을 던진다.
--  - 오류는 RAISE EXCEPTION '<코드>' 로 던진다.
--  - SECURITY DEFINER + SET search_path = public. 동적 SQL 은 쓰지 않는다(정렬은 CASE 화이트리스트).
--  - auth.users 에서는 email 만 읽어 반환한다(다른 컬럼은 반환하지 않는다).
--  - 반환 컬럼은 camelCase 따옴표 이름이라 JS 클라이언트에서 camelCase 키로 받는다.
--  - 실행 권한: PUBLIC/anon 회수, authenticated/service_role 에만 부여.
--
-- 1) admin_list_inquiries(p_statuses, p_category, p_uncategorized_only, p_since, p_keyword,
--                         p_sort, p_sort_dir, p_limit, p_offset)
--    params
--      p_statuses text[]            상태 필터(waiting/in_progress/answered/closed). NULL 또는 빈 배열 = 전체
--      p_category text              카테고리 필터. p_uncategorized_only 가 true 면 무시
--      p_uncategorized_only boolean true 면 category IS NULL(미분류)만
--      p_since timestamptz          "createdAt" >= p_since
--      p_keyword text               trim 후 100자로 자름, 2자 미만이면 무시.
--                                   제목 또는 모든 메시지(메모 포함) 본문 ILIKE 부분 일치 (%, _, \ 이스케이프)
--      p_sort text                  'waiting'("waitingSince") | 'confidence'("categoryConfidence", NULL 은 항상 마지막)
--                                   | 'createdAt'. 기본 'waiting'
--                                   'waiting' 은 큐 순서다: 방향과 관계없이 상태 그룹(waiting < in_progress < 그 외)을
--                                   먼저 오름차순으로 놓고, 그룹 안에서 "waitingSince" 를 p_sort_dir 로 정렬한다.
--                                   즉 asc 면 담당자 없는 답변 대기 건이 처리 중 건보다 앞에, 각 그룹은 오래된 순.
--      p_sort_dir text              'asc' | 'desc'. 기본 'desc'. (waiting 정렬에서 asc = 가장 오래 기다린 순)
--      p_limit integer              1..100 으로 보정(NULL 이면 20)
--      p_offset integer             0 이상으로 보정(NULL 이면 0)
--    returns TABLE(id, title, status, category, "categoryConfidence", "waitingSince", "createdAt",
--                  "assigneeId", "assigneeEmail", "totalCount")
--      "totalCount" = 페이지네이션 이전 전체 건수(count(*) OVER ()). offset 이 범위를 넘으면 행이 없어 알 수 없다.
--    errors: unauthorized, forbidden, invalid_filter(허용되지 않는 status/category/sort/dir)
--
-- 2) admin_pending_inquiry_count()
--    returns bigint : status IN ('waiting','in_progress') 인 문의 수
--    errors: unauthorized, forbidden
--
-- 3) admin_get_inquiry(p_inquiry_id uuid)
--    returns TABLE(id, "userId", title, status, category, "categoryConfidence", "deviceInfo", "assigneeId",
--                  "assigneeEmail", "hasUnreadReply", rating, "closeReason", "waitingSince", "createdAt", "updatedAt")
--    errors: unauthorized, forbidden, not_found
--
-- 4) admin_get_inquiry_messages(p_inquiry_id uuid)
--    returns TABLE(id, "inquiryId", kind, "authorId", "authorEmail", body, attachments, "createdAt")
--      메모(kind = 'memo')를 포함한다. "createdAt", id 오름차순.
--    errors: unauthorized, forbidden, not_found
--
-- 5) admin_list_admins()
--    returns TABLE("userId", email) : 담당자 드롭다운용 운영자 목록(이메일 오름차순)
--    errors: unauthorized, forbidden
--
-- 6) admin_user_recent_inquiries(p_inquiry_id uuid, p_limit integer DEFAULT 5)
--    returns TABLE(id, title, status, category, "createdAt")
--      p_inquiry_id 와 같은 사용자의 다른 문의(자기 자신 제외), 최신순. p_limit 은 1..20 으로 보정.
--    errors: unauthorized, forbidden, not_found

-- 보조 인덱스: "createdAt" 정렬/기간 필터용 (status+waitingSince, assignee 인덱스는 이미 존재)
CREATE INDEX IF NOT EXISTS inquiries_created_at_idx
  ON inquiries ("createdAt" DESC);

-- ---------------------------------------------------------------------------
-- 1) 문의 목록
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_list_inquiries(
  p_statuses text[] DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_uncategorized_only boolean DEFAULT false,
  p_since timestamptz DEFAULT NULL,
  p_keyword text DEFAULT NULL,
  p_sort text DEFAULT 'waiting',
  p_sort_dir text DEFAULT 'desc',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  status text,
  category text,
  "categoryConfidence" numeric,
  "waitingSince" timestamptz,
  "createdAt" timestamptz,
  "assigneeId" uuid,
  "assigneeEmail" text,
  "totalCount" bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_sort text := COALESCE(p_sort, 'waiting');
  v_dir text := COALESCE(p_sort_dir, 'desc');
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
  v_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
  v_statuses text[] := p_statuses;
  v_category text := p_category;
  v_uncat boolean := COALESCE(p_uncategorized_only, false);
  v_keyword text := NULL;
  v_pattern text := NULL;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_sort NOT IN ('waiting', 'confidence', 'createdAt') THEN
    RAISE EXCEPTION 'invalid_filter';
  END IF;
  IF v_dir NOT IN ('asc', 'desc') THEN
    RAISE EXCEPTION 'invalid_filter';
  END IF;

  IF v_statuses IS NOT NULL THEN
    IF cardinality(v_statuses) = 0 THEN
      v_statuses := NULL;
    ELSIF EXISTS (
      SELECT 1
      FROM unnest(v_statuses) AS s(value)
      WHERE s.value IS NULL
         OR s.value NOT IN ('waiting', 'in_progress', 'answered', 'closed')
    ) THEN
      RAISE EXCEPTION 'invalid_filter';
    END IF;
  END IF;

  IF v_uncat THEN
    v_category := NULL;
  ELSIF v_category IS NOT NULL AND v_category NOT IN (
    'shared_household', 'record_category', 'stats_screen',
    'account_login', 'bug_report', 'feature_request', 'other'
  ) THEN
    RAISE EXCEPTION 'invalid_filter';
  END IF;

  -- 키워드: trim -> 100자 -> 2자 미만 무시 -> LIKE 메타문자 이스케이프(\ 를 먼저)
  IF p_keyword IS NOT NULL THEN
    v_keyword := left(btrim(p_keyword), 100);
    IF char_length(v_keyword) < 2 THEN
      v_keyword := NULL;
    ELSE
      v_pattern := '%' || replace(replace(replace(
        v_keyword, chr(92), chr(92) || chr(92)), '%', chr(92) || '%'), '_', chr(92) || '_') || '%';
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    i.id,
    i.title,
    i.status,
    i.category,
    i."categoryConfidence",
    i."waitingSince",
    i."createdAt",
    i."assigneeId",
    u.email::text,
    count(*) OVER ()
  FROM inquiries i
  LEFT JOIN auth.users u ON u.id = i."assigneeId"
  WHERE (v_statuses IS NULL OR i.status = ANY (v_statuses))
    AND (NOT v_uncat OR i.category IS NULL)
    AND (v_uncat OR v_category IS NULL OR i.category = v_category)
    AND (p_since IS NULL OR i."createdAt" >= p_since)
    AND (
      v_pattern IS NULL
      OR i.title ILIKE v_pattern
      OR EXISTS (
        SELECT 1
        FROM "inquiry-messages" m
        WHERE m."inquiryId" = i.id
          AND m.body ILIKE v_pattern
      )
    )
  ORDER BY
    CASE WHEN v_sort = 'waiting' THEN
      CASE i.status WHEN 'waiting' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END
    END ASC,
    CASE WHEN v_sort = 'waiting' AND v_dir = 'asc' THEN i."waitingSince" END ASC,
    CASE WHEN v_sort = 'waiting' AND v_dir = 'desc' THEN i."waitingSince" END DESC,
    CASE WHEN v_sort = 'confidence' AND v_dir = 'asc' THEN i."categoryConfidence" END ASC NULLS LAST,
    CASE WHEN v_sort = 'confidence' AND v_dir = 'desc' THEN i."categoryConfidence" END DESC NULLS LAST,
    CASE WHEN v_sort = 'createdAt' AND v_dir = 'asc' THEN i."createdAt" END ASC,
    CASE WHEN v_sort = 'createdAt' AND v_dir = 'desc' THEN i."createdAt" END DESC,
    i.id ASC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2) 처리 대기 건수
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_pending_inquiry_count()
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count bigint;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT count(*) INTO v_count
  FROM inquiries i
  WHERE i.status IN ('waiting', 'in_progress');

  RETURN v_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3) 문의 상세
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_get_inquiry(p_inquiry_id uuid)
RETURNS TABLE (
  id uuid,
  "userId" uuid,
  title text,
  status text,
  category text,
  "categoryConfidence" numeric,
  "deviceInfo" jsonb,
  "assigneeId" uuid,
  "assigneeEmail" text,
  "hasUnreadReply" boolean,
  rating smallint,
  "closeReason" text,
  "waitingSince" timestamptz,
  "createdAt" timestamptz,
  "updatedAt" timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    i.id,
    i."userId",
    i.title,
    i.status,
    i.category,
    i."categoryConfidence",
    i."deviceInfo",
    i."assigneeId",
    u.email::text,
    i."hasUnreadReply",
    i.rating,
    i."closeReason",
    i."waitingSince",
    i."createdAt",
    i."updatedAt"
  FROM inquiries i
  LEFT JOIN auth.users u ON u.id = i."assigneeId"
  WHERE i.id = p_inquiry_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4) 문의 메시지 (메모 포함)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_get_inquiry_messages(p_inquiry_id uuid)
RETURNS TABLE (
  id uuid,
  "inquiryId" uuid,
  kind text,
  "authorId" uuid,
  "authorEmail" text,
  body text,
  attachments text[],
  "createdAt" timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM inquiries i WHERE i.id = p_inquiry_id) THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m."inquiryId",
    m.kind,
    m."authorId",
    u.email::text,
    m.body,
    m.attachments,
    m."createdAt"
  FROM "inquiry-messages" m
  LEFT JOIN auth.users u ON u.id = m."authorId"
  WHERE m."inquiryId" = p_inquiry_id
  ORDER BY m."createdAt" ASC, m.id ASC;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5) 운영자 목록 (담당자 드롭다운)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_list_admins()
RETURNS TABLE (
  "userId" uuid,
  email text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT a."userId", u.email::text
  FROM admins a
  JOIN auth.users u ON u.id = a."userId"
  ORDER BY u.email ASC, a."userId" ASC;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6) 같은 사용자의 다른 문의
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_user_recent_inquiries(
  p_inquiry_id uuid,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  status text,
  category text,
  "createdAt" timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_user_id uuid;
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 5), 1), 20);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT t."userId" INTO v_user_id
  FROM inquiries t
  WHERE t.id = p_inquiry_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  RETURN QUERY
  SELECT i.id, i.title, i.status, i.category, i."createdAt"
  FROM inquiries i
  WHERE i."userId" = v_user_id
    AND i.id <> p_inquiry_id
  ORDER BY i."createdAt" DESC, i.id ASC
  LIMIT v_limit;
END;
$$;

-- ---------------------------------------------------------------------------
-- 실행 권한: PUBLIC/anon 회수 후 로그인 사용자와 service_role 에만 부여
-- (어드민 여부는 각 함수 내부에서 is_admin() 으로 검사)
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION admin_list_inquiries(text[], text, boolean, timestamptz, text, text, text, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION admin_pending_inquiry_count() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION admin_get_inquiry(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION admin_get_inquiry_messages(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION admin_list_admins() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION admin_user_recent_inquiries(uuid, integer) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION admin_list_inquiries(text[], text, boolean, timestamptz, text, text, text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_pending_inquiry_count() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_get_inquiry(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_get_inquiry_messages(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_list_admins() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_user_recent_inquiries(uuid, integer) TO authenticated, service_role;
