import type { GuideSection } from '../config/guide';
import styles from './guide.module.css';

type Props = {
  sections: GuideSection[];
};

export const GuideToc = ({ sections }: Props) => {
  return (
    <nav className={styles.toc} aria-label="목차">
      <p className={styles.tocTitle}>목차</p>
      <ol role="list" className={styles.tocList}>
        {sections.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`} className={styles.tocLink}>
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
};
