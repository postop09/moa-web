export type LegalListItem = {
  term?: string;
  description: string;
};

export type LegalBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: LegalListItem[] };

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocumentContent = {
  title: string;
  effectiveDate: string;
  intro: string[];
  sections: LegalSection[];
};
