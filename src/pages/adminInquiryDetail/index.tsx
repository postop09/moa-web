import { AdminInquiryDetailView } from './ui/AdminInquiryDetailView';

type Props = {
  inquiryId: string;
  /** 이전 문의를 훑어보려고 연 미리보기. 답변 대기 문의를 열지 않고 담당자도 지정하지 않는다. */
  peek?: boolean;
};

// 문의나 열람 방식이 바뀌면 입력 초안과 열기 여부를 새로 시작하도록 key 로 화면을 나눈다.
// 클라이언트 경계는 ui/ 의 컴포넌트가 가진다.
export const AdminInquiryDetailPage = ({ inquiryId, peek = false }: Props) => (
  <AdminInquiryDetailView
    key={`${inquiryId}:${peek}`}
    inquiryId={inquiryId}
    peek={peek}
  />
);

export default AdminInquiryDetailPage;
