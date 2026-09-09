import type { GuideArticle } from '../guide';

export const OWNER_AND_MEMBER_ROLES_ARTICLE: GuideArticle = {
  slug: 'owner-and-member-roles',
  seriesId: 'shared-ledger',
  order: 3,
  title: '소유자와 멤버, 공유 가계부 권한 정리',
  description:
    '공유 가계부의 소유자와 멤버가 각각 할 수 있는 일이 무엇인지, 가계부 나가기와 삭제는 어떻게 다른지, 나간 뒤 기록은 어떻게 되는지 정리해 안내합니다.',
  summary:
    '소유자와 멤버의 권한 차이, 가계부 나가기와 삭제의 차이를 정리했습니다.',
  publishedDate: '2026-09-09',
  keywords: ['가계부 권한', '소유자', '멤버', '가계부 나가기', '가계부 삭제'],
  sections: [
    {
      id: 'two-roles',
      title: '역할은 소유자와 멤버 둘뿐',
      blocks: [
        {
          type: 'paragraph',
          text: '공유 가계부의 역할은 소유자(owner)와 멤버 두 가지뿐입니다. 멤버 목록에는 각자의 역할이 배지로 표시되고, 본인의 이름 옆에는 "(나)"가 붙습니다.',
        },
      ],
    },
    {
      id: 'owner-only',
      title: '소유자만 할 수 있는 일',
      blocks: [
        {
          type: 'list',
          items: [
            { description: '새 멤버 초대하기' },
            { description: '보낸 초대 취소하기' },
            { description: '멤버 추방하기(자기 자신은 추방할 수 없음)' },
            { description: '가계부 삭제하기' },
          ],
        },
      ],
    },
    {
      id: 'member-can-do',
      title: '멤버가 할 수 있는 일',
      blocks: [
        {
          type: 'paragraph',
          text: '멤버는 거래 기록, 일정 등록, 카테고리 관리를 포함한 일상적인 가계부 사용을 소유자와 동일하게 할 수 있습니다. 다만 가계부에서 나가는 것은 소유자가 아닌 멤버만 선택할 수 있는 동작입니다.',
        },
      ],
    },
    {
      id: 'leave-vs-delete',
      title: '나가기와 삭제는 다릅니다',
      blocks: [
        {
          type: 'list',
          items: [
            {
              term: '가계부 삭제',
              description: '가계부와 거래, 카테고리가 모두 삭제됩니다.',
            },
            {
              term: '가계부 나가기',
              description:
                '이 가계부에서 나가고 더 이상 내역을 볼 수 없습니다.',
            },
          ],
        },
      ],
    },
    {
      id: 'after-leaving',
      title: '나간 뒤 내 기록은 어떻게 되나요',
      blocks: [
        {
          type: 'paragraph',
          text: '가계부에서 나가면 구성원 정보만 삭제되고, 그동안 작성한 거래와 일정 기록은 가계부에 그대로 남습니다.',
        },
      ],
    },
    {
      id: 'faq',
      title: '자주 묻는 질문',
      blocks: [
        {
          type: 'list',
          items: [
            {
              term: '소유자를 다른 사람으로 바꿀 수 있나요?',
              description:
                '지원하지 않습니다. 소유자 위임(변경) 기능은 없습니다.',
            },
            {
              term: '마지막 가계부를 나가거나 삭제하면 어떻게 되나요?',
              description:
                '참여 중인 가계부가 하나도 남지 않으면 새 가계부 만들기 화면으로 이동합니다.',
            },
          ],
        },
      ],
    },
  ],
};
