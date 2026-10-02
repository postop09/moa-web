import type { InquiryCategory } from './inquiryCategories';

export const INQUIRY_CLASSIFY_INSTRUCTIONS =
  '공유 가계부 앱 "모아"에 접수된 사용자 문의 내용을 읽고, 아래 기준 중 가장 알맞은 카테고리 하나로 분류한다.';

export const INQUIRY_CLASSIFY_CRITERIA: Record<InquiryCategory, string> = {
  shared_household:
    '공유 가계부 만들기, 멤버 초대 링크, 초대 수락, 멤버 관리, 가계부 함께 쓰기와 관련된 문의',
  record_category:
    '수입·지출 기록 작성과 수정, 카테고리 추가와 변경, 반복 거래, 일정 등록과 관련된 문의',
  stats_screen:
    '통계와 차트, 월별·주별 합계, 달력과 내역 화면 표시, 화면 구성과 사용 방법에 관한 문의',
  account_login:
    '로그인, 회원 가입, 구글 계정 연동, 프로필 설정, 계정 탈퇴와 관련된 문의',
  bug_report:
    '앱이 멈추거나 오류가 나는 문제, 화면이 제대로 보이지 않거나 동작하지 않는 현상을 알리는 신고',
  feature_request:
    '새로운 기능을 추가하거나 기존 기능을 개선해 달라는 제안과 건의',
  other: '위 어느 카테고리에도 해당하지 않거나 내용을 구분하기 어려운 문의',
};
