import Image from 'next/image';

type Props = {
  variant?: 'black' | 'white';
  className?: string;
  priority?: boolean;
  size?: number;
};

export const MoaLogo = ({
  variant = 'black',
  className,
  priority = false,
  size = 40,
}: Props) => {
  return (
    <Image
      src={`/icons/icon_logo_${variant}.png`}
      alt="Moa"
      width={size}
      height={size}
      className={className}
      priority={priority}
    />
  );
};
