import { getSiteUrl } from '@/shared/config';

import { GUIDE_ARTICLES } from '../config/articles';

export const getGuideCollectionJsonLd = () => {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '가이드',
    description:
      '가족, 커플과 공유 가계부를 시작하고 함께 쓰는 방법을 정리한 가이드 모음입니다.',
    url: `${siteUrl}/guide`,
    inLanguage: 'ko',
    isPartOf: { '@id': `${siteUrl}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: GUIDE_ARTICLES.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteUrl}/guide/${article.slug}`,
        name: article.title,
      })),
    },
  };
};
