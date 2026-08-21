import { HIGHLIGHTS } from '../config/highlights';
import { WELCOME_SECTION_IDS } from '../config/sections';
import styles from './welcome.module.css';

export const HighlightsSection = () => {
  return (
    <section
      id={WELCOME_SECTION_IDS.highlights}
      className={styles.section}
      aria-labelledby="highlights-title"
    >
      <div className={styles.sectionInner}>
        <p className={styles.eyebrow}>일단 핵심부터</p>
        <h2 id="highlights-title" className={styles.sectionTitle}>
          모아로 할 수 있는 일
        </h2>
        <ul className={styles.highlightGrid}>
          {HIGHLIGHTS.map((item) => (
            <li key={item.id}>
              <a href={item.href} className={styles.highlightCard}>
                <h3 className={styles.highlightTitle}>{item.title}</h3>
                <p className={styles.highlightText}>{item.description}</p>
                <span className={styles.highlightLink}>살펴보기</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
