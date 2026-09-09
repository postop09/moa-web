import type { GuideArticle } from '../guide';

export const ACCEPT_INVITE_ARTICLE: GuideArticle = {
  slug: 'accept-invite',
  seriesId: 'shared-ledger',
  order: 2,
  title: '초대 링크로 공유 가계부에 참여하기',
  description:
    '가족이나 파트너에게 받은 초대 링크를 열어 초대받은 이메일 계정으로 Google 로그인 하고, 초대 내용을 확인한 뒤 공유 가계부에 멤버로 참여하는 방법을 안내합니다.',
  summary:
    '초대 링크를 열고 Google 로그인 한 다음 초대를 수락해 가계부에 참여하는 순서를 소개합니다.',
  publishedDate: '2026-09-09',
  keywords: [
    '초대 링크',
    '공유 가계부',
    '가계부 참여',
    'Google 로그인',
    '가족 가계부',
  ],
  sections: [
    {
      id: 'got-invite-link',
      title: '초대 링크를 받았다면',
      blocks: [
        {
          type: 'paragraph',
          text: '가족이나 파트너에게 /invite/토큰 형태의 초대 링크를 받았다면, 그 링크를 브라우저에서 엽니다.',
        },
      ],
    },
    {
      id: 'sign-in-with-invited-email',
      title: '초대받은 이메일 계정으로 Google 로그인',
      blocks: [
        {
          type: 'paragraph',
          text: '초대 화면이 열리면 초대받은 이메일 주소와 정확히 같은 계정으로 Google 로그인을 해야 합니다. 로그인한 이메일과 초대 이메일이 다르면 초대를 수락할 수 없습니다.',
        },
      ],
    },
    {
      id: 'review-invite',
      title: '초대 내용 확인하기',
      blocks: [
        {
          type: 'paragraph',
          text: '로그인하면 초대한 가계부 이름과 초대받은 이메일이 화면에 표시됩니다. "초대를 수락하면 이 가계부에 멤버로 참여합니다."라는 안내 문구도 함께 보입니다.',
        },
        {
          type: 'list',
          items: [
            { term: '가계부', description: '초대받은 가계부의 이름입니다.' },
            {
              term: '초대 이메일',
              description: '초대장이 발급된 이메일 주소입니다.',
            },
          ],
        },
      ],
    },
    {
      id: 'accept-invite',
      title: '초대 수락 누르기',
      blocks: [
        {
          type: 'steps',
          items: [
            '초대 내용을 확인합니다.',
            '"초대 수락" 버튼을 누릅니다.',
            '참여하는 동안 버튼에 "참여하는 중…"이 표시됩니다.',
          ],
        },
      ],
    },
    {
      id: 'messages',
      title: '이런 메시지가 보인다면',
      blocks: [
        {
          type: 'list',
          items: [
            {
              term: '초대받은 이메일(...)과 로그인 계정이 다릅니다.',
              description:
                '로그아웃한 뒤 초대 이메일과 같은 Google 계정으로 다시 로그인하세요.',
            },
            {
              term: '이미 처리된 초대입니다.',
              description:
                '이미 수락되었거나 취소된 초대입니다. 가계부 소유자에게 새 초대를 요청하세요.',
            },
            {
              term: '초대를 찾을 수 없습니다.',
              description:
                '링크가 잘못되었거나 만료된 것일 수 있습니다. 소유자에게 링크를 다시 받아보세요.',
            },
            {
              term: '초대 수락에 실패했습니다.',
              description:
                '일시적인 오류일 수 있습니다. 잠시 후 "초대 수락" 버튼을 다시 눌러보세요.',
            },
          ],
        },
      ],
    },
    {
      id: 'after-joining',
      title: '참여한 다음 할 일',
      blocks: [
        {
          type: 'paragraph',
          text: '참여가 끝나면 곧바로 가계부 화면으로 이동합니다. 프로필에 설정한 닉네임이 앞으로 이 가계부에서 작성자 이름으로 쓰입니다.',
        },
        {
          type: 'note',
          text: '닉네임은 누가 쓴 기록인지 구분하는 이름이므로, 서로 알아보기 쉬운 이름으로 정해두면 좋습니다.',
        },
      ],
    },
  ],
};
