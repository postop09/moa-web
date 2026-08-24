import { contactEmail, operatorName, siteName } from '@/shared/config';

import type { LegalDocumentContent } from './legalDocument';

export const PRIVACY_POLICY: LegalDocumentContent = {
  title: '개인정보처리방침',
  effectiveDate: '2026년 8월 24일',
  intro: [
    `${operatorName}(이하 "운영자")은 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.`,
    `본 방침은 ${siteName}(이하 "서비스")를 이용하는 과정에서 어떤 정보가 수집되고 어떻게 처리되는지를 안내합니다.`,
  ],
  sections: [
    {
      id: 'collection',
      title: '1. 수집하는 개인정보 항목과 수집 방법',
      blocks: [
        {
          type: 'paragraph',
          text: '운영자는 서비스 제공에 필요한 최소한의 정보만 수집합니다.',
        },
        {
          type: 'list',
          items: [
            {
              term: '계정 정보',
              description:
                'Google 계정으로 로그인할 때 제공되는 이메일 주소와 계정 식별자(UUID)를 수집합니다. Google 프로필 사진이나 실명은 저장하지 않습니다.',
            },
            {
              term: '프로필 정보',
              description:
                '이용자가 직접 입력한 닉네임을 저장합니다. 실명일 필요는 없습니다.',
            },
            {
              term: '이용자가 입력한 서비스 데이터',
              description:
                '가계부 이름, 거래 내역(금액, 거래명, 메모, 거래 일시, 정기 여부), 카테고리와 예산, 일정(제목, 메모, 기간)이 저장됩니다.',
            },
            {
              term: '가계부 공유 정보',
              description:
                '이용자가 다른 사람을 가계부에 초대하면, 초대 대상의 이메일 주소와 초대 토큰이 저장됩니다.',
            },
            {
              term: '자동 수집 정보',
              description:
                '서비스 이용 과정에서 접속 기록, 브라우저 및 기기 정보, 페이지 성능 지표가 자동으로 생성되어 처리될 수 있습니다.',
            },
          ],
        },
        {
          type: 'paragraph',
          text: '운영자는 주민등록번호, 계좌번호, 카드번호 등 금융 실명 정보를 수집하지 않으며, 금융기관 계좌에 직접 연결하지 않습니다. 가계부에 기록되는 금액은 전적으로 이용자가 직접 입력한 값입니다.',
        },
      ],
    },
    {
      id: 'purpose',
      title: '2. 개인정보의 처리 목적',
      blocks: [
        {
          type: 'list',
          items: [
            { description: '회원 식별 및 로그인 상태 유지' },
            { description: '가계부 생성, 조회, 수정, 삭제 등 핵심 기능 제공' },
            {
              description: '가계부 공유를 위한 초대 발송 및 구성원 권한 관리',
            },
            {
              description:
                '서비스 오류 파악, 성능 개선, 부정 이용 방지 등 서비스 품질 향상',
            },
            { description: '문의사항 확인 및 응대' },
          ],
        },
      ],
    },
    {
      id: 'retention',
      title: '3. 개인정보의 보유 및 이용 기간',
      blocks: [
        {
          type: 'paragraph',
          text: '운영자는 이용자가 서비스를 이용하는 동안 개인정보를 보유하며, 아래 사유가 발생하면 지체 없이 파기합니다.',
        },
        {
          type: 'list',
          items: [
            {
              term: '계정 삭제 요청',
              description:
                '이용자가 아래 문의 이메일로 삭제를 요청하면, 계정 정보와 프로필 정보를 삭제합니다.',
            },
            {
              term: '가계부 삭제',
              description:
                '가계부를 삭제하면 해당 가계부에 속한 거래, 카테고리, 일정, 구성원 정보, 초대 기록이 함께 삭제되며 복구할 수 없습니다.',
            },
            {
              term: '가계부 나가기',
              description:
                '이용자가 공유 가계부에서 나가면 구성원 정보는 삭제되지만, 이미 기록한 거래와 일정은 해당 가계부에 남습니다. 남은 기록을 지우려면 나가기 전에 직접 삭제해야 합니다.',
            },
          ],
        },
        {
          type: 'paragraph',
          text: '관련 법령에서 일정 기간 보존을 요구하는 경우에는 해당 기간 동안 분리 보관한 후 파기합니다.',
        },
      ],
    },
    {
      id: 'third-party',
      title: '4. 개인정보의 제3자 제공',
      blocks: [
        {
          type: 'paragraph',
          text: '운영자는 이용자의 개인정보를 제3자에게 판매하거나 제공하지 않습니다. 다만 이용자가 동의한 경우 또는 법령에 따라 수사기관의 적법한 요청이 있는 경우에는 예외로 합니다.',
        },
        {
          type: 'paragraph',
          text: '가계부를 공유하면 해당 가계부의 다른 구성원에게 이용자의 닉네임과 이용자가 입력한 거래·일정 내역이 공개됩니다. 이는 서비스의 공유 기능에 따른 것으로, 공유 대상은 이용자가 직접 선택합니다.',
        },
      ],
    },
    {
      id: 'processors',
      title: '5. 개인정보 처리 위탁 및 국외 이전',
      blocks: [
        {
          type: 'paragraph',
          text: '운영자는 안정적인 서비스 제공을 위해 아래 사업자에게 개인정보 처리를 위탁하고 있으며, 이들 사업자의 서버는 국외에 위치할 수 있습니다.',
        },
        {
          type: 'list',
          items: [
            {
              term: 'Supabase',
              description:
                '데이터베이스 저장 및 인증 처리. 계정 정보와 이용자가 입력한 서비스 데이터를 보관합니다.',
            },
            {
              term: 'Vercel',
              description:
                '웹 서비스 호스팅, 접속 통계 및 성능 측정(Analytics, Speed Insights).',
            },
            {
              term: 'Google',
              description:
                'OAuth 로그인 인증. 이용자가 Google 계정으로 로그인할 때 이메일과 기본 프로필 정보가 인증 과정에서 전달됩니다.',
            },
          ],
        },
      ],
    },
    {
      id: 'cookies',
      title: '6. 쿠키 및 브라우저 저장소',
      blocks: [
        {
          type: 'paragraph',
          text: '서비스는 로그인 상태 유지와 이용 편의를 위해 아래 정보를 브라우저에 저장합니다.',
        },
        {
          type: 'list',
          items: [
            {
              term: '인증 세션 쿠키',
              description:
                'Supabase가 발급하는 로그인 세션 쿠키입니다. HttpOnly로 설정되어 스크립트에서 접근할 수 없습니다.',
            },
            {
              term: 'moa_gate 쿠키',
              description:
                '온보딩 완료 여부를 기억해 매 요청마다 데이터베이스를 조회하지 않도록 하는 쿠키입니다. 로그아웃 시 삭제됩니다.',
            },
            {
              term: '브라우저 로컬 저장소',
              description:
                '마지막으로 선택한 가계부 식별자와 앱 설치 안내를 닫았는지 여부를 저장합니다. 개인 식별 정보는 담지 않습니다.',
            },
          ],
        },
        {
          type: 'paragraph',
          text: '브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 인증 쿠키를 차단하면 로그인이 유지되지 않아 서비스를 이용할 수 없습니다.',
        },
      ],
    },
    {
      id: 'rights',
      title: '7. 정보주체의 권리와 행사 방법',
      blocks: [
        {
          type: 'paragraph',
          text: '이용자는 언제든지 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요구할 수 있습니다.',
        },
        {
          type: 'list',
          items: [
            {
              description:
                '거래, 일정, 카테고리, 가계부는 서비스 화면에서 직접 수정하거나 삭제할 수 있습니다.',
            },
            {
              description: `계정 전체 삭제와 그 밖의 권리 행사는 ${contactEmail} 으로 요청해 주시면 확인 후 처리합니다.`,
            },
          ],
        },
        {
          type: 'paragraph',
          text: '대리인을 통해 권리를 행사하는 경우에는 위임장을 제출해야 합니다.',
        },
      ],
    },
    {
      id: 'destruction',
      title: '8. 개인정보의 파기 절차 및 방법',
      blocks: [
        {
          type: 'paragraph',
          text: '보유 기간이 지나거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일 형태의 정보는 복구할 수 없는 방법으로 영구 삭제하며, 출력물이 있는 경우 분쇄하거나 소각합니다.',
        },
      ],
    },
    {
      id: 'security',
      title: '9. 개인정보의 안전성 확보 조치',
      blocks: [
        {
          type: 'list',
          items: [
            {
              description: '모든 통신 구간에 HTTPS 암호화를 적용합니다.',
            },
            {
              description:
                '데이터베이스에 행 수준 보안(Row Level Security)을 적용하여, 이용자는 자신이 속한 가계부의 데이터에만 접근할 수 있습니다.',
            },
            {
              description:
                '인증 토큰은 스크립트에서 접근할 수 없는 HttpOnly 쿠키로 관리합니다.',
            },
            {
              description:
                '비밀번호를 직접 보관하지 않고 Google OAuth 인증에 위임합니다.',
            },
          ],
        },
      ],
    },
    {
      id: 'children',
      title: '10. 만 14세 미만 아동의 개인정보',
      blocks: [
        {
          type: 'paragraph',
          text: '서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 아동의 개인정보를 의도적으로 수집하지 않습니다. 만 14세 미만 아동의 정보가 수집된 사실을 확인하면 즉시 삭제합니다.',
        },
      ],
    },
    {
      id: 'officer',
      title: '11. 개인정보 보호책임자 및 문의',
      blocks: [
        {
          type: 'list',
          items: [
            { term: '개인정보 보호책임자', description: operatorName },
            { term: '문의 이메일', description: contactEmail },
          ],
        },
        {
          type: 'paragraph',
          text: '개인정보 침해에 대한 신고나 상담이 필요한 경우 개인정보분쟁조정위원회(1833-6972), 개인정보침해신고센터(118), 대검찰청 사이버수사과(1301), 경찰청 사이버수사국(182)에 문의하실 수 있습니다.',
        },
      ],
    },
    {
      id: 'changes',
      title: '12. 방침의 변경',
      blocks: [
        {
          type: 'paragraph',
          text: '본 방침의 내용이 추가, 삭제, 수정되는 경우 변경 사항의 시행 최소 7일 전에 서비스 화면을 통해 공지합니다. 다만 이용자의 권리에 중대한 영향을 미치는 변경은 최소 30일 전에 공지합니다.',
        },
      ],
    },
  ],
};
