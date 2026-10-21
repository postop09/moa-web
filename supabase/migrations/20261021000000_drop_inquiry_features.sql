-- 1:1 문의하기 / FAQ / 운영자(admin) 기능 제거
-- 이전 마이그레이션 이력은 유지하고, 여기서 해당 객체를 모두 걷어낸다.
-- 데이터가 영구 삭제되므로 적용 전 필요하면 백업한다.
-- Storage 버킷 'inquiry-attachments' 는 SQL 로 지울 수 없어(Storage API 전용) 정책만 제거한다.
-- 버킷은 `supabase --experimental storage rm -r --linked ss:///inquiry-attachments` 로 별도 삭제했다.

-- Storage 정책
DROP POLICY IF EXISTS inquiry_attachments_select ON storage.objects;
DROP POLICY IF EXISTS inquiry_attachments_insert ON storage.objects;
DROP POLICY IF EXISTS inquiry_attachments_delete ON storage.objects;

-- RPC 함수 (오버로드가 있어도 이름 기준으로 모두 제거)
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'admin_add_memo',
        'admin_close_inquiry',
        'admin_get_inquiry',
        'admin_get_inquiry_messages',
        'admin_list_admins',
        'admin_list_inquiries',
        'admin_open_inquiry',
        'admin_pending_inquiry_count',
        'admin_reply_inquiry',
        'admin_update_inquiry_meta',
        'admin_user_recent_inquiries',
        'add_inquiry_follow_up',
        'close_inquiry',
        'create_inquiry',
        'increment_faq_helpful',
        'inquiry_log_event',
        'inquiry_normalize_attachments',
        'mark_inquiry_read',
        'rate_inquiry',
        'update_inquiry'
      )
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', fn.signature);
  END LOOP;
END;
$$;

-- 테이블 (정책·인덱스는 함께 제거된다)
DROP TABLE IF EXISTS "inquiry-events" CASCADE;
DROP TABLE IF EXISTS "inquiry-messages" CASCADE;
DROP TABLE IF EXISTS inquiries CASCADE;
DROP TABLE IF EXISTS "faq-helpful-votes" CASCADE;
DROP TABLE IF EXISTS faqs CASCADE;

-- 운영자 (is_admin 은 위 테이블의 정책이 쓰던 함수라 테이블 제거 뒤에 지운다)
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
