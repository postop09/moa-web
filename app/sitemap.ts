import type { MetadataRoute } from 'next';

import { getSiteUrl } from '@/shared/config';

const sitemap = (): MetadataRoute.Sitemap => {
  return [
    {
      url: `${getSiteUrl()}/welcome`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${getSiteUrl()}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ];
};

export default sitemap;
