import type { MetadataRoute } from 'next';

import { getSiteUrl } from '@/shared/config';

const isProduction = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === 'production'
  : process.env.NODE_ENV === 'production';

const robots = (): MetadataRoute.Robots => {
  if (!isProduction) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/welcome', '/privacy', '/terms'],
      disallow: [
        '/login',
        '/history',
        '/calendar',
        '/stats',
        '/write',
        '/settings',
        '/onboarding',
        '/invite',
        '/auth',
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
};

export default robots;
