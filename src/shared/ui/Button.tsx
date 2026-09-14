'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ComponentProps,
  ReactNode,
} from 'react';

import styles from './button.module.css';

type Variant = 'primary' | 'secondary' | 'danger' | 'dangerText' | 'text';
type Size = 'md' | 'sm';

type BaseProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'disabled'> & {
    as?: 'button';
    href?: never;
    target?: never;
  };

type ButtonAsAnchor = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'href'> & {
    as: 'a';
    href: string;
  };

type ButtonAsLink = BaseProps &
  Omit<ComponentProps<typeof Link>, 'children'> & {
    as: typeof Link;
  };

type Props = ButtonAsButton | ButtonAsAnchor | ButtonAsLink;

// `as`의 유니온 판별값 중 `typeof Link`가 단위 타입(unit type)이 아니라서
// `props.as === 'a'` 같은 단순 비교로는 TS가 유니온을 좁혀주지 못한다.
// 타입 서술어(type predicate) 함수로 명시적으로 좁혀준다.
const isAnchorProps = (props: Props): props is ButtonAsAnchor =>
  props.as === 'a';

const isLinkProps = (props: Props): props is ButtonAsLink => props.as === Link;

const getButtonClassName = ({
  variant,
  size,
  fullWidth,
  className,
}: {
  variant: Variant;
  size: Size;
  fullWidth: boolean;
  className?: string;
}) =>
  [
    styles.button,
    styles[variant],
    size === 'sm' ? styles.sm : '',
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

const getButtonContent = ({
  loading,
  loadingLabel,
  size,
  children,
}: {
  loading: boolean;
  loadingLabel: string | undefined;
  size: Size;
  children: ReactNode;
}) => (
  <>
    {loading ? (
      <Loader2
        className={styles.spinner}
        size={size === 'sm' ? 12 : 16}
        aria-hidden
      />
    ) : null}
    {loading && loadingLabel ? loadingLabel : children}
  </>
);

export const Button = (props: Props) => {
  if (isAnchorProps(props)) {
    const {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      loadingLabel,
      disabled = false,
      className,
      children,
      href,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- rest에서 'as'를 제외하기 위한 구조 분해
      as: _as,
      ...rest
    } = props;

    const isDisabled = loading || disabled;

    return (
      // href를 비우거나 제거하면 <a>가 접근성 role="link"를 잃어버려
      // (aria-query의 anchor role은 href가 "존재하고 비어있지 않을 것"을 요구한다)
      // 기존 aria-disabled 테스트가 깨진다. href는 그대로 두고
      // tabIndex만 -1로 만들어 키보드 탭 이동에서 제외한다.
      <a
        {...rest}
        href={href}
        tabIndex={isDisabled ? -1 : rest.tabIndex}
        className={getButtonClassName({ variant, size, fullWidth, className })}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        onClick={(event) => {
          if (isDisabled) {
            event.preventDefault();
            return;
          }
          rest.onClick?.(event);
        }}
      >
        {getButtonContent({ loading, loadingLabel, size, children })}
      </a>
    );
  }

  if (isLinkProps(props)) {
    const {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      loadingLabel,
      disabled = false,
      className,
      children,
      href,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- rest에서 'as'를 제외하기 위한 구조 분해
      as: _as,
      ...rest
    } = props;

    const isDisabled = loading || disabled;

    return (
      // href는 그대로 두고(제거·공백 처리 시 접근성 role 및 next/link의
      // 런타임 prop 검증과 충돌한다) tabIndex만 -1로 만들어 키보드 탭
      // 이동에서 제외한다.
      <Link
        {...rest}
        href={href}
        tabIndex={isDisabled ? -1 : rest.tabIndex}
        className={getButtonClassName({ variant, size, fullWidth, className })}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        onClick={(event) => {
          if (isDisabled) {
            event.preventDefault();
            return;
          }
          rest.onClick?.(event);
        }}
      >
        {getButtonContent({ loading, loadingLabel, size, children })}
      </Link>
    );
  }

  const {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    loadingLabel,
    disabled = false,
    className,
    children,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- rest에서 'as'를 제외하기 위한 구조 분해
    as: _as,
    ...rest
  } = props;

  const isDisabled = loading || disabled;

  return (
    <button
      type="button"
      {...rest}
      className={getButtonClassName({ variant, size, fullWidth, className })}
      disabled={isDisabled}
      aria-busy={loading || undefined}
    >
      {getButtonContent({ loading, loadingLabel, size, children })}
    </button>
  );
};
