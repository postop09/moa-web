import { FACTS } from '../config/facts';
import { WELCOME_SECTION_IDS } from '../config/sections';
import styles from './welcome.module.css';

export const FactsBand = () => {
  return (
    <section
      id={WELCOME_SECTION_IDS.facts}
      className={`${styles.section} ${styles.factsSection}`}
      aria-labelledby="facts-title"
    >
      <div className={styles.sectionInner}>
        <p className={styles.eyebrow}>핵심은</p>
        <h2 id="facts-title" className={styles.sectionTitle}>
          복잡한 조건 없이 바로
        </h2>
        <ul className={styles.factsGrid}>
          {FACTS.map((fact) => (
            <li key={fact.id} className={styles.factItem}>
              <p className={styles.factValue}>{fact.value}</p>
              <p className={styles.factLabel}>{fact.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
