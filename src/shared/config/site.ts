export const siteName = '모아';

export const defaultTitle = '모아(Moa) — 그래프로 보는 가계부';

export const titleTemplate = '%s | 모아';

export const description =
  '모아(Moa)는 그래프 중심 가계부입니다. 숫자로 보는 지출과 수입·저축 흐름을 한눈에 파악하세요.';

export const keywords = [
  '가계부',
  '지출분석',
  '자산관리',
  '가계부 앱',
  '그래프 가계부',
  '모아',
  'Moa',
];

export const ogImage = {
  url: '/icons/icon-512.png',
  width: 512,
  height: 512,
  alt: siteName,
} as const;

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

export const getWebApplicationJsonLd = () => {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: siteName,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description,
    url: `${siteUrl}/login`,
    inLanguage: 'ko',
    image: `${siteUrl}${ogImage.url}`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
  };
};
