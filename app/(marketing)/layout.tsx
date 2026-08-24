import { type ReactNode } from 'react';

import { SiteFooter } from '@/widgets/siteFooter';

type Props = {
  children: ReactNode;
};

const MarketingLayout = ({ children }: Props) => {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
};

export default MarketingLayout;
