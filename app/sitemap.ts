import type { MetadataRoute } from 'next';

import { getSiteUrl } from '@/shared/config';

const sitemap = (): MetadataRoute.Sitemap => {
  return [
    {
      url: `${getSiteUrl()}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
};

export default sitemap;
