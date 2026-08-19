import { create } from 'zustand';

type UiState = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
};

type UiActions = {
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
};

type UiStore = UiState & UiActions;

export const useUiStore = create<UiStore>((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}));
