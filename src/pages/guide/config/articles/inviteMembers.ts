import type { GuideArticle } from '../guide';

export const INVITE_MEMBERS_ARTICLE: GuideArticle = {
  slug: 'invite-members',
  seriesId: 'shared-ledger',
  order: 1,
  title: '공유 가계부에 가족·커플 초대하는 방법',
  description:
    '모아 공유 가계부에서 소유자가 설정 화면의 멤버 섹션에서 이메일로 멤버를 초대하고, 초대 링크를 만들어 전달하며 보낸 초대를 취소하는 방법까지 단계별로 안내합니다.',
  summary:
    '설정 화면에서 이메일로 멤버를 초대하고 초대 링크를 전달하는 방법을 소개합니다.',
  publishedDate: '2026-09-09',
  keywords: [
    '가계부 초대',
    '공유 가계부',
    '가족 가계부',
    '커플 가계부',
    '멤버 초대',
  ],
  sections: [
    {
      id: 'before-you-start',
      title: '시작하기 전에',
      blocks: [
        {
          type: 'paragraph',
          text: '가계부를 처음 만든 사람이 소유자(owner)가 됩니다. 새로운 멤버를 초대하는 기능은 소유자에게만 열려 있고, 초대는 상대방의 이메일 주소를 기준으로 이뤄집니다.',
        },
        {
          type: 'note',
          text: '멤버로 참여 중이라면 초대 버튼 자체가 보이지 않습니다. 초대가 필요하면 가계부 소유자에게 요청하세요.',
        },
      ],
    },
    {
      id: 'open-invite-panel',
      title: '설정에서 멤버 초대 열기',
      blocks: [
        {
          type: 'steps',
          items: [
            '설정 화면으로 이동합니다.',
            '"멤버" 섹션을 찾습니다.',
            '섹션 오른쪽 위의 "초대" 버튼을 누릅니다.',
          ],
        },
      ],
    },
    {
      id: 'send-invite',
      title: '이메일 입력하고 초대 링크 만들기',
      blocks: [
        {
          type: 'paragraph',
          text: '"멤버 초대" 창이 열리면 초대할 사람의 이메일을 입력하고 "초대 링크 만들기" 버튼을 누릅니다. 초대를 만드는 동안에는 버튼에 "초대 중…"이 표시됩니다.',
        },
        {
          type: 'list',
          items: [
            {
              term: '올바른 이메일을 입력해 주세요.',
              description:
                '이메일 형식이 아닌 값을 입력했을 때 나타납니다. 이메일 주소를 다시 확인하세요.',
            },
            {
              term: '자기 자신은 초대할 수 없습니다.',
              description:
                '로그인한 계정과 같은 이메일을 입력하면 나타납니다. 초대할 다른 사람의 이메일을 입력하세요.',
            },
            {
              term: '이미 가계부에 있는 멤버입니다.',
              description:
                '이미 참여 중인 멤버의 이메일을 입력하면 나타납니다. 멤버 목록을 먼저 확인하세요.',
            },
          ],
        },
      ],
    },
    {
      id: 'share-invite-link',
      title: '링크 전달하기',
      blocks: [
        {
          type: 'paragraph',
          text: '초대 링크를 만들면 "초대 링크" 창에 /invite/토큰 형태의 링크가 표시됩니다.',
        },
        {
          type: 'list',
          items: [
            {
              term: '링크 복사',
              description:
                '버튼을 누르면 링크가 클립보드에 복사되고 버튼 표시가 "복사됨"으로 바뀝니다. 원하는 메신저나 메모 앱에 붙여넣어 전달하세요.',
            },
            {
              term: '메일 앱으로 보내기',
              description:
                '버튼을 누르면 초대 이메일 주소로 메일 앱이 열립니다.',
            },
          ],
        },
        {
          type: 'note',
          text: 'Google로 로그인한 이메일이 초대 주소와 같아야 합니다.',
        },
      ],
    },
    {
      id: 'check-and-cancel',
      title: '보낸 초대 확인하고 취소하기',
      blocks: [
        {
          type: 'paragraph',
          text: '멤버 목록 아래 "초대 대기" 그룹에서 보낸 초대를 확인할 수 있습니다. 아직 수락되지 않은 초대에는 "수락 대기 중"이라고 표시됩니다.',
        },
        {
          type: 'steps',
          items: [
            '멤버 섹션의 "초대 대기" 그룹을 확인합니다.',
            '취소할 초대 옆의 "취소" 버튼을 누릅니다.',
            '취소가 진행되는 동안 버튼에 "취소 중…"이 표시됩니다.',
          ],
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
              term: '초대 링크에는 유효기간이 있나요?',
              description:
                '따로 유효기간은 없습니다. 소유자가 취소하거나 상대방이 수락하기 전까지 계속 유효합니다.',
            },
            {
              term: '이메일을 잘못 입력했어요.',
              description:
                '해당 초대를 취소한 뒤 올바른 이메일로 다시 초대하세요.',
            },
            {
              term: '링크가 유출된 것 같아요.',
              description:
                '해당 초대를 취소하고 새로 초대해 링크를 재발급하세요.',
            },
          ],
        },
      ],
    },
  ],
};
