import type { GuideArticle } from '../guide';

export const AUTHOR_VIEW_ARTICLE: GuideArticle = {
  slug: 'author-view',
  seriesId: 'shared-ledger',
  order: 4,
  title: '함께 쓰는 가계부, 누가 썼는지 구분해서 보기',
  description:
    '공유 가계부의 거래와 일정마다 남는 작성자 정보를 내역 화면과 달력 화면에서 확인하고, 달력 사이드바에서 작성자별로 골라 보는 방법을 안내합니다.',
  summary:
    '내역과 달력 화면에서 누가 쓴 기록인지 확인하고, 작성자별로 골라 보는 방법을 소개합니다.',
  publishedDate: '2026-09-09',
  keywords: [
    '가계부 작성자',
    '공유 가계부',
    '달력 필터',
    '커플 가계부',
    '부부 가계부',
  ],
  sections: [
    {
      id: 'every-record-has-author',
      title: '모든 기록에는 작성자가 남습니다',
      blocks: [
        {
          type: 'paragraph',
          text: '가계부에 등록한 거래와 일정에는 누가 작성했는지가 함께 저장됩니다. 작성자 이름은 프로필에 설정한 닉네임이고, 프로필 정보를 찾을 수 없으면 "알 수 없음"으로 표시됩니다.',
        },
      ],
    },
    {
      id: 'author-in-history',
      title: '내역에서 누가 썼는지 보기',
      blocks: [
        {
          type: 'paragraph',
          text: '내역 화면의 거래 목록에는 각 항목마다 작성자 이름이 함께 표시됩니다.',
        },
      ],
    },
    {
      id: 'author-filter-in-calendar',
      title: '달력에서 사람별로 골라 보기',
      blocks: [
        {
          type: 'paragraph',
          text: '달력 화면 사이드바에는 "작성자" 그룹이 있습니다. "전체"를 누르면 모든 멤버의 기록을 보고, 멤버 칩을 누르면 그 사람이 작성한 기록만 볼 수 있습니다. 본인의 칩에는 이름 옆에 "(나)"가 붙고, 멤버마다 다른 색이 지정됩니다.',
        },
      ],
    },
    {
      id: 'day-detail',
      title: '하루 상세로 확인하기',
      blocks: [
        {
          type: 'paragraph',
          text: '달력에서 날짜를 선택하면 그날의 거래와 일정이 작성자와 함께 나열됩니다.',
        },
      ],
    },
    {
      id: 'for-couples',
      title: '커플·부부가 쓰는 방법',
      blocks: [
        {
          type: 'list',
          items: [
            {
              description:
                '참여 전에 프로필 닉네임을 서로 알아보기 쉬운 이름으로 정해두세요.',
            },
            {
              description:
                '월말에는 달력 사이드바의 작성자 필터로 각자 얼마씩 썼는지 훑어보세요.',
            },
          ],
        },
      ],
    },
    {
      id: 'good-to-know',
      title: '알아두면 좋은 점',
      blocks: [
        {
          type: 'note',
          text: '작성자 필터는 달력 화면에만 있습니다. 내역과 통계 화면은 가계부 전체 기준으로 보여줍니다.',
        },
      ],
    },
  ],
};
