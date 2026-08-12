import styles from './login.module.css';

export const BrandHero = () => {
  return (
    <header className={styles.hero}>
      <p className={styles.brand}>Moa</p>
      <h1 className={styles.headline}>숫자로 보는 지출</h1>
      <p className={styles.support}>그래프 중심 가계부로 흐름을 한눈에.</p>
    </header>
  );
};
