import Link from 'next/link';

import { MoaLogo } from '@/shared/ui';

import type { LegalBlock, LegalDocumentContent } from '../config/legalDocument';
import styles from './legal.module.css';

type BlockProps = {
  block: LegalBlock;
};

const LegalBlockView = ({ block }: BlockProps) => {
  if (block.type === 'paragraph') {
    return <p className={styles.paragraph}>{block.text}</p>;
  }

  return (
    <ul className={styles.list}>
      {block.items.map((item) => (
        <li key={item.term ?? item.description} className={styles.listItem}>
          {item.term ? <span className={styles.term}>{item.term}</span> : null}
          {item.description}
        </li>
      ))}
    </ul>
  );
};

type Props = {
  content: LegalDocumentContent;
};

export const LegalDocument = ({ content }: Props) => {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/welcome" className={styles.brand}>
            <MoaLogo variant="black" size={28} alt="" priority />
            모아
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <article className={styles.article}>
          <h1 className={styles.title}>{content.title}</h1>
          <p className={styles.effectiveDate}>
            시행일: {content.effectiveDate}
          </p>

          {content.intro.map((text) => (
            <p key={text} className={styles.intro}>
              {text}
            </p>
          ))}

          <nav className={styles.toc} aria-label="목차">
            <p className={styles.tocTitle}>목차</p>
            <ol className={styles.tocList}>
              {content.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className={styles.tocLink}>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {content.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className={styles.section}
              aria-labelledby={`${section.id}-title`}
            >
              <h2 id={`${section.id}-title`} className={styles.sectionTitle}>
                {section.title}
              </h2>
              {section.blocks.map((block, index) => (
                <LegalBlockView
                  key={
                    block.type === 'paragraph'
                      ? block.text
                      : `${section.id}-list-${index}`
                  }
                  block={block}
                />
              ))}
            </section>
          ))}
        </article>
      </main>
    </div>
  );
};
