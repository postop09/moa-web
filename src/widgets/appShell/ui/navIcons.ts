import {
  Calendar,
  Home,
  List,
  Settings,
  type LucideIcon,
} from 'lucide-react';

import type { NavItemId } from '@/shared/config';

export const navIcons: Record<NavItemId, LucideIcon> = {
  home: Home,
  history: List,
  calendar: Calendar,
  settings: Settings,
};
