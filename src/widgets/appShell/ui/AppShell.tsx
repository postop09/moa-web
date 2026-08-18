import type { ReactNode } from 'react';

import { BottomTabBar } from './BottomTabBar';
import { NavigationProgress } from './NavigationProgress';
import { Sidebar } from './Sidebar';
import { WriteFab } from './WriteFab';
import styles from './appShell.module.css';

type Props = {
  children: ReactNode;
};

export const AppShell = ({ children }: Props) => {
  return (
    <div className={styles.shell}>
      <NavigationProgress />
      <Sidebar />
      <div className={styles.main}>{children}</div>
      <BottomTabBar />
      <WriteFab />
    </div>
  );
};
