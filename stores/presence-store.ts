import { create } from 'zustand';

interface PresenceStore {
  onlineUsers: Set<string>;
  setOnlineUsers: (users: Set<string>) => void;
}

export const usePresenceStore = create<PresenceStore>((set) => ({
  onlineUsers: new Set<string>(),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
}));
