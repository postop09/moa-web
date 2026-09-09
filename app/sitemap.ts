import type { MetadataRoute } from 'next';

import { GUIDE_ARTICLES } from '@/pages/guide';
import { getSiteUrl } from '@/shared/config';

const toDate = (dateString: string) => new Date(`${dateString}T00:00:00.000Z`);

const sitemap = (): MetadataRoute.Sitemap => {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  const guideDates = GUIDE_ARTICLES.map((article) =>
    toDate(article.updatedDate ?? article.publishedDate).getTime(),
  );
  const guideListLastModified =
    guideDates.length > 0 ? new Date(Math.max(...guideDates)) : lastModified;

  return [
    {
      url: `${siteUrl}/welcome`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${siteUrl}/guide`,
      lastModified: guideListLastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...GUIDE_ARTICLES.map((article) => ({
      url: `${siteUrl}/guide/${article.slug}`,
      lastModified: toDate(article.updatedDate ?? article.publishedDate),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    {
      url: `${siteUrl}/privacy`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
};

export default sitemap;
