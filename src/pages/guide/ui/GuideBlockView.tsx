import type { GuideBlock } from '../config/guide';
import styles from './guide.module.css';

type Props = {
  block: GuideBlock;
};

export const GuideBlockView = ({ block }: Props) => {
  if (block.type === 'paragraph') {
    return <p className={styles.paragraph}>{block.text}</p>;
  }

  if (block.type === 'list') {
    return (
      <ul className={styles.list}>
        {block.items.map((item) => (
          <li key={item.term ?? item.description} className={styles.listItem}>
            {item.term ? (
              <span className={styles.term}>{item.term}</span>
            ) : null}
            {item.description}
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === 'steps') {
    return (
      <ol role="list" className={styles.steps}>
        {block.items.map((step) => (
          <li key={step} className={styles.stepItem}>
            {step}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <aside className={styles.note}>
      <p className={styles.noteLabel}>{block.label ?? '알아두기'}</p>
      <p className={styles.noteText}>{block.text}</p>
    </aside>
  );
};
