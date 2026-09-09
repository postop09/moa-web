import { GUIDE_ARTICLES } from '../config/articles';
import type { GuideArticle } from '../config/guide';

export const getGuideArticleSlugs = (): string[] =>
  GUIDE_ARTICLES.map((article) => article.slug);

export const getGuideArticleBySlug = (slug: string): GuideArticle | undefined =>
  GUIDE_ARTICLES.find((article) => article.slug === slug);

export const getArticlesBySeries = (seriesId: string): GuideArticle[] =>
  GUIDE_ARTICLES.filter((article) => article.seriesId === seriesId).sort(
    (a, b) => a.order - b.order,
  );

export const getRelatedArticles = (article: GuideArticle): GuideArticle[] =>
  getArticlesBySeries(article.seriesId).filter(
    (item) => item.slug !== article.slug,
  );

export type AdjacentArticles = {
  previous?: GuideArticle;
  next?: GuideArticle;
};

export const getAdjacentArticles = (
  article: GuideArticle,
): AdjacentArticles => {
  const seriesArticles = getArticlesBySeries(article.seriesId);
  const index = seriesArticles.findIndex((item) => item.slug === article.slug);

  if (index === -1) {
    return {};
  }

  return {
    previous: index > 0 ? seriesArticles[index - 1] : undefined,
    next:
      index < seriesArticles.length - 1 ? seriesArticles[index + 1] : undefined,
  };
};
