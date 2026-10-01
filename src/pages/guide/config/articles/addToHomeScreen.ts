import type { GuideArticle } from '../guide';

export const ADD_TO_HOME_SCREEN_ARTICLE: GuideArticle = {
  slug: 'add-to-home-screen',
  seriesId: 'getting-started',
  order: 1,
  title: '모바일 홈 화면에 모아 앱 추가하기',
  description:
    '아이폰 Safari와 안드로이드 Chrome에서 모아를 홈 화면에 추가해 앱처럼 바로 실행하는 방법을 안내합니다.',
  summary:
    '앱스토어 설치 없이 홈 화면에 모아 아이콘을 추가하는 순서를 기기별로 소개합니다.',
  publishedDate: '2026-10-01',
  keywords: [
    '홈 화면에 추가',
    '앱 설치',
    'PWA',
    '아이폰',
    '안드로이드',
    '가계부 앱',
  ],
  sections: [
    {
      id: 'why-install',
      title: '홈 화면에 추가하면 좋은 점',
      blocks: [
        {
          type: 'list',
          items: [
            {
              term: '바로 실행',
              description:
                '홈 화면의 아이콘을 눌러 앱처럼 바로 열 수 있습니다.',
            },
            {
              term: '전체 화면',
              description: '브라우저 주소창 없이 넓은 화면으로 볼 수 있습니다.',
            },
            {
              term: '설치 부담 없음',
              description: '앱스토어를 거치지 않고 몇 번의 터치로 추가됩니다.',
            },
          ],
        },
      ],
    },
    {
      id: 'iphone',
      title: '아이폰·아이패드 (Safari)',
      blocks: [
        {
          type: 'steps',
          items: [
            'Safari에서 모아에 접속합니다.',
            '화면 하단의 공유 버튼을 탭합니다.',
            '"홈 화면에 추가"를 선택합니다.',
            '이름을 확인하고 "추가"를 누릅니다.',
          ],
        },
        {
          type: 'note',
          text: 'iOS에서는 Safari가 아닌 다른 브라우저에서 메뉴 위치가 다를 수 있으니 Safari로 진행하는 것을 권장합니다.',
        },
      ],
    },
    {
      id: 'android',
      title: '안드로이드 (Chrome)',
      blocks: [
        {
          type: 'steps',
          items: [
            'Chrome에서 모아에 접속합니다.',
            '오른쪽 위의 ⋮ 메뉴를 누릅니다.',
            '"앱 설치" 또는 "홈 화면에 추가"를 선택합니다.',
            '확인 창에서 "설치"를 누릅니다.',
          ],
        },
        {
          type: 'note',
          text: '화면 아래에 설치 안내가 나타나면 그 버튼을 눌러 바로 설치할 수도 있습니다.',
        },
      ],
    },
    {
      id: 'in-app-banner',
      title: '앱 안의 설치 안내',
      blocks: [
        {
          type: 'paragraph',
          text: '로그인한 뒤 화면에 보이는 설치 안내에서도 같은 방법을 확인할 수 있습니다. 아이폰에서는 "하단 공유 버튼을 탭하세요." 안내를 따라 "홈 화면에 추가"를 선택하면 됩니다.',
        },
      ],
    },
    {
      id: 'troubleshooting',
      title: '이런 경우에는',
      blocks: [
        {
          type: 'list',
          items: [
            {
              term: '"홈 화면에 추가" 메뉴가 보이지 않습니다.',
              description:
                '카카오톡 같은 앱 안의 브라우저에서는 메뉴가 없을 수 있습니다. 링크를 Safari나 Chrome으로 열어 다시 시도하세요.',
            },
            {
              term: '이미 추가한 것 같습니다.',
              description:
                '홈 화면이나 앱 목록에서 모아 아이콘을 찾아보세요. 이미 설치되어 있으면 다시 추가할 필요가 없습니다.',
            },
            {
              term: '아이콘을 지우고 싶습니다.',
              description:
                '아이콘을 길게 눌러 삭제하거나 제거를 선택하면 됩니다. 기록은 계정에 저장되어 있어 지워지지 않습니다.',
            },
          ],
        },
      ],
    },
  ],
};
