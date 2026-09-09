export type GuideListItem = {
  term?: string;
  description: string;
};

export type GuideBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: GuideListItem[] }
  | { type: 'steps'; items: string[] }
  | { type: 'note'; label?: string; text: string };

export type GuideSection = {
  id: string;
  title: string;
  blocks: GuideBlock[];
};

export type GuideArticle = {
  slug: string;
  seriesId: string;
  order: number;
  title: string;
  description: string;
  summary: string;
  publishedDate: string;
  updatedDate?: string;
  keywords: string[];
  sections: GuideSection[];
};

export type GuideSeries = {
  id: string;
  title: string;
  description: string;
};
