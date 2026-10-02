-- 1:1 문의하기: RLS, 테이블 권한, 첨부 파일 Storage 버킷/정책
-- 사용자·운영자 모두 직접 INSERT/UPDATE 불가. 쓰기는 RPC(SECURITY DEFINER)로만 수행한다.
--
-- [중요] 컬럼 단위 SELECT 권한과 운영자 조회 방식
-- 사용자와 운영자는 같은 Postgres 롤(authenticated)이므로 컬럼 GRANT 는 운영자에게도 똑같이 적용된다.
-- inquiries 의 "closeReason", "categoryConfidence", "assigneeId" 와
-- inquiry-messages 의 "authorId" 는 어떤 authenticated 사용자도 직접 SELECT 할 수 없다
-- (클라이언트는 select('*') 금지, 허용 컬럼을 명시해야 한다).
-- 따라서 운영자 화면은 테이블을 직접 읽지 않고 SECURITY DEFINER 어드민 RPC
-- (admin_list_inquiries / admin_get_inquiry 등, 이후 PR 에서 추가)로만 조회한다.
-- 이 때문에 inquiries / inquiry-messages 의 운영자용 SELECT 정책은 두지 않는다
-- (두면 운영자가 일부 컬럼만 직접 읽는 두 번째 경로가 생겨 혼란만 커진다).
-- inquiry-events 는 사용자용 컬럼 제한이 없고 운영자 전용이므로 정책을 유지한다.

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inquiry-messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inquiry-events" ENABLE ROW LEVEL SECURITY;

-- 테이블 권한: 기본 부여분을 모두 회수한 뒤 필요한 것만 명시적으로 부여
REVOKE ALL ON TABLE admins, faqs, inquiries, "inquiry-messages", "inquiry-events"
  FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE admins TO authenticated;
GRANT SELECT ON TABLE faqs TO authenticated;
-- inquiries: 사용자에게 안전한 컬럼만 SELECT 허용 + 본인 문의 삭제(DELETE, RLS 로 본인 행만)
GRANT SELECT (
  id, "userId", title, status, category, "deviceInfo",
  "hasUnreadReply", rating, "waitingSince", "createdAt", "updatedAt"
) ON TABLE inquiries TO authenticated;
GRANT DELETE ON TABLE inquiries TO authenticated;
-- inquiry-messages: "authorId" 제외
GRANT SELECT (
  id, "inquiryId", kind, body, attachments, "createdAt"
) ON TABLE "inquiry-messages" TO authenticated;
GRANT SELECT ON TABLE "inquiry-events" TO authenticated;

GRANT ALL ON TABLE admins, faqs, inquiries, "inquiry-messages", "inquiry-events"
  TO service_role;

-- admins: 본인 행만 조회 (운영자 여부 확인은 is_admin() 사용)
DROP POLICY IF EXISTS admins_select_own ON admins;
CREATE POLICY admins_select_own ON admins
  FOR SELECT TO authenticated
  USING ("userId" = (SELECT auth.uid()));

-- faqs: 로그인 사용자 조회
DROP POLICY IF EXISTS faqs_select_authenticated ON faqs;
CREATE POLICY faqs_select_authenticated ON faqs
  FOR SELECT TO authenticated
  USING (true);

-- inquiries
DROP POLICY IF EXISTS inquiries_select_own ON inquiries;
CREATE POLICY inquiries_select_own ON inquiries
  FOR SELECT TO authenticated
  USING ("userId" = (SELECT auth.uid()));

-- 이전 버전에서 만들었을 수 있는 운영자 SELECT 정책 제거 (위 헤더 참고)
DROP POLICY IF EXISTS inquiries_select_admin ON inquiries;

DROP POLICY IF EXISTS inquiries_delete_own ON inquiries;
CREATE POLICY inquiries_delete_own ON inquiries
  FOR DELETE TO authenticated
  USING ("userId" = (SELECT auth.uid()));

-- inquiry-messages: 사용자는 본인 문의의 메모가 아닌 메시지만 (운영자는 어드민 RPC 로 조회)
DROP POLICY IF EXISTS inquiry_messages_select_own ON "inquiry-messages";
CREATE POLICY inquiry_messages_select_own ON "inquiry-messages"
  FOR SELECT TO authenticated
  USING (
    kind <> 'memo'
    AND EXISTS (
      SELECT 1
      FROM inquiries i
      WHERE i.id = "inquiry-messages"."inquiryId"
        AND i."userId" = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS inquiry_messages_select_admin ON "inquiry-messages";

-- inquiry-events: 운영자만 조회
DROP POLICY IF EXISTS inquiry_events_select_admin ON "inquiry-events";
CREATE POLICY inquiry_events_select_admin ON "inquiry-events"
  FOR SELECT TO authenticated
  USING ((SELECT is_admin()));

-- Storage: private 버킷 (경로 {userId}/{folderId}/{uuid}.ext, folderId 는 클라이언트 생성, 10MB, 이미지만)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inquiry-attachments',
  'inquiry-attachments',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS inquiry_attachments_select ON storage.objects;
CREATE POLICY inquiry_attachments_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'inquiry-attachments'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR (SELECT public.is_admin())
    )
  );

DROP POLICY IF EXISTS inquiry_attachments_insert ON storage.objects;
CREATE POLICY inquiry_attachments_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'inquiry-attachments'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR (SELECT public.is_admin())
    )
  );

DROP POLICY IF EXISTS inquiry_attachments_delete ON storage.objects;
CREATE POLICY inquiry_attachments_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'inquiry-attachments'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR (SELECT public.is_admin())
    )
  );
