import { create } from 'zustand';

interface UIState {
  zenMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  toggleZenMode: () => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
}

export const useUIStore = create<UIState>((set) => ({
  zenMode: false,
  fontSize: 'medium',
  toggleZenMode: () => set((state) => ({ zenMode: !state.zenMode })),
  setFontSize: (size) => set({ fontSize: size }),
}));
