import styles from './skeleton.module.css';

type Props = {
  width?: string;
  height?: string;
  circle?: boolean;
  className?: string;
};

// 원형은 인라인으로 준다 — 호출측 모듈 클래스와 .skeleton의 border-radius 특이도 경합을 피하기 위함.
export const Skeleton = ({ width, height, circle, className }: Props) => (
  <span
    aria-hidden="true"
    className={[styles.skeleton, className].filter(Boolean).join(' ')}
    style={{ width, height, borderRadius: circle ? '50%' : undefined }}
  />
);
