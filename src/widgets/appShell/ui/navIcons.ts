import {
  Calendar,
  ChartColumn,
  Home,
  Settings,
  type LucideIcon,
} from 'lucide-react';

import type { NavItemId } from '@/shared/config';

export const navIcons: Record<NavItemId, LucideIcon> = {
  home: Home,
  stats: ChartColumn,
  calendar: Calendar,
  settings: Settings,
};
