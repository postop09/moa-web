import { type ReactNode } from 'react';

import { TabsShell } from '@/widgets/tabsShell';

type Props = {
  children: ReactNode;
};

const TabsLayout = ({ children }: Props) => {
  return <TabsShell>{children}</TabsShell>;
};

export default TabsLayout;
