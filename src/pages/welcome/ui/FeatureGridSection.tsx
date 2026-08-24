import { FEATURES } from '../config/features';
import { WELCOME_SECTION_IDS } from '../config/sections';
import styles from './welcome.module.css';

export const FeatureGridSection = () => {
  return (
    <section
      id={WELCOME_SECTION_IDS.features}
      className={`${styles.section}`}
      aria-labelledby="features-title"
    >
      <div className={styles.sectionInner}>
        <p className={styles.eyebrow}>기능</p>
        <h2 id="features-title" className={styles.sectionTitle}>
          돈의 흐름을 한곳에
        </h2>
        <p className={styles.sectionLead}>
          기록부터 예산, 공유, 통계까지. 가계부에 필요한 것만 담았습니다.
        </p>
        <ul className={styles.featureGrid}>
          {FEATURES.map((feature) => (
            <li key={feature.id} className={styles.featureCard}>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureText}>{feature.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
