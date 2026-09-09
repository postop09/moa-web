import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  getGuideArticleBySlug,
  getGuideArticleSlugs,
  getGuideSeriesById,
  GuideArticlePage,
} from '@/pages/guide';
import {
  getArticleJsonLd,
  getBaseOpenGraph,
  getBreadcrumbJsonLd,
} from '@/shared/config';

type Props = {
  params: Promise<{ slug: string }>;
};

export const generateStaticParams = () => {
  return getGuideArticleSlugs().map((slug) => ({ slug }));
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { slug } = await params;
  const article = getGuideArticleBySlug(slug);

  if (!article) {
    return {};
  }

  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    alternates: {
      canonical: `/guide/${article.slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      ...getBaseOpenGraph(),
      type: 'article',
      url: `/guide/${article.slug}`,
      title: `${article.title} | 모아`,
      description: article.description,
      publishedTime: article.publishedDate,
      modifiedTime: article.updatedDate ?? article.publishedDate,
    },
  };
};

const GuideArticleRoutePage = async ({ params }: Props) => {
  const { slug } = await params;
  const article = getGuideArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const series = getGuideSeriesById(article.seriesId);

  const articleJsonLd = getArticleJsonLd({
    slug: article.slug,
    title: article.title,
    description: article.description,
    publishedDate: article.publishedDate,
    updatedDate: article.updatedDate,
    keywords: article.keywords,
    seriesTitle: series?.title ?? '',
  });

  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: '모아', path: '/welcome' },
    { name: '가이드', path: '/guide' },
    { name: article.title, path: `/guide/${article.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <GuideArticlePage article={article} />
    </>
  );
};

export default GuideArticleRoutePage;
