import Image from 'next/image';

type Props = {
  variant?: 'black' | 'white';
  className?: string;
  priority?: boolean;
  size?: number;
  /** 옆에 브랜드명 텍스트가 함께 있으면 빈 문자열을 넘겨 중복 낭독을 막습니다. */
  alt?: string;
};

export const MoaLogo = ({
  variant = 'black',
  className,
  priority = false,
  size = 40,
  alt = 'Moa',
}: Props) => {
  return (
    <Image
      src={`/icons/icon_logo_${variant}.png`}
      alt={alt}
      width={size}
      height={size}
      className={className}
      priority={priority}
    />
  );
};
