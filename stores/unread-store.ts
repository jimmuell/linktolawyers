import { create } from 'zustand';

interface UnreadStore {
  totalUnread: number;
  setTotalUnread: (count: number) => void;
}

export const useUnreadStore = create<UnreadStore>((set) => ({
  totalUnread: 0,
  setTotalUnread: (totalUnread) => set({ totalUnread }),
}));
