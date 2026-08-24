export const siteName = '모아';

export const operatorName = '모아 운영팀';

export const contactEmail = 'team_moa@naver.com';

export const defaultTitle = '모아(Moa) — 그래프로 보는 가계부';

export const titleTemplate = '%s | 모아';

export const description =
  '모아(Moa)는 그래프 중심 가계부입니다. 통계와 그래프로 보는 지출과 수입·저축 흐름을 한눈에 파악하세요.';

export const keywords = [
  '가계부',
  '지출분석',
  '자산관리',
  '가계부 앱',
  '웹 가계부',
  '그래프 가계부',
  '모아',
  'Moa',
  '모아 가계부',
  '가계부 공유',
  '공유 가계부',
  '공유 달력',
];

// scripts/generateOgImage.ts 로 생성합니다.
export const ogImage = {
  url: '/og/og-default.png',
  width: 1200,
  height: 630,
  alt: '모아 — 그래프로 보는 가계부',
} as const;

export const logoImage = '/icons/icon-512.png';

/**
 * Next.js는 페이지에서 openGraph를 정의하면 상위 metadata의 openGraph를 통째로
 * 교체합니다. 이미지·타입·locale이 사라지지 않도록 각 페이지에서 이 값을 펼쳐 씁니다.
 */
export const getBaseOpenGraph = () => ({
  type: 'website' as const,
  locale: 'ko_KR',
  siteName,
  images: [{ ...ogImage }],
});

export const getSiteUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;

  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (productionHost) {
    return `https://${productionHost.replace(/\/$/, '')}`;
  }

  const vercelHost = process.env.VERCEL_URL;

  if (vercelHost) {
    return `https://${vercelHost.replace(/\/$/, '')}`;
  }

  return 'http://localhost:3000';
};

export const getWebSiteJsonLd = () => {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: siteName,
        url: siteUrl,
        logo: `${siteUrl}${logoImage}`,
        email: contactEmail,
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: siteName,
        url: siteUrl,
        description,
        inLanguage: 'ko',
        publisher: { '@id': `${siteUrl}/#organization` },
      },
    ],
  };
};

export const getWebApplicationJsonLd = () => {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: siteName,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description,
    url: `${siteUrl}/welcome`,
    inLanguage: 'ko',
    image: `${siteUrl}${ogImage.url}`,
    browserRequirements: '최신 버전의 웹 브라우저',
    featureList: [
      '수입·지출·저축 기록',
      '카테고리별 예산 관리',
      '통계와 그래프로 보는 지출 흐름',
      '가족과 함께 쓰는 공유 가계부',
      '일정과 지출을 함께 보는 달력',
    ],
    publisher: { '@id': `${siteUrl}/#organization` },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
  };
};
