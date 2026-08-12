import styles from './placeholderPage.module.css';

type Props = {
  title: string;
  description: string;
};

export const PlaceholderPage = ({ title, description }: Props) => {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
    </main>
  );
};
