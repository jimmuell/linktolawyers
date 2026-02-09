import type { Session, User } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';
import type { AttorneyProfile, Profile, ProfileInsert } from '@/types';

interface AuthStore {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  attorneyProfile: AttorneyProfile | null;
  isLoading: boolean;
  isInitialized: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsInitialized: (initialized: boolean) => void;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Omit<Profile, 'id'>>) => Promise<void>;
  uploadAvatar: (fileUri: string) => Promise<string>;
  deleteAvatar: () => Promise<void>;
  fetchAttorneyProfile: (userId: string) => Promise<void>;
  updateAttorneyProfile: (updates: Partial<Omit<AttorneyProfile, 'id'>>) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  attorneyProfile: null,
  isLoading: false,
  isInitialized: false,

  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsInitialized: (isInitialized) => set({ isInitialized }),

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) {
        set({ session: data.session, user: data.session.user });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, fullName, role) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });
      if (error) throw error;

      if (data.user) {
        const profile: ProfileInsert = {
          id: data.user.id,
          username: null,
          full_name: fullName,
          avatar_url: null,
          website: null,
          role: role as Profile['role'],
        };
        await supabase.from('profiles').upsert(profile as never);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      // Remove all push tokens for this user before signing out
      const userId = get().user?.id;
      if (userId) {
        await supabase
          .from('push_tokens')
          .delete()
          .eq('user_id', userId);
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ session: null, user: null, profile: null, attorneyProfile: null });
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      set({ profile: data as Profile });
    }
  },

  updateProfile: async (updates) => {
    const userId = get().user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq('id', userId);

    if (error) throw error;

    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null,
    }));
  },

  uploadAvatar: async (fileUri) => {
    const userId = get().user?.id;
    if (!userId) throw new Error('Not authenticated');

    const base64 = await readAsStringAsync(fileUri, { encoding: 'base64' });

    const filePath = `${userId}/avatar.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, decode(base64), {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await get().updateProfile({ avatar_url: avatarUrl });
    return avatarUrl;
  },

  deleteAvatar: async () => {
    const userId = get().user?.id;
    if (!userId) throw new Error('Not authenticated');

    const filePath = `${userId}/avatar.jpg`;

    // Remove from storage (ignore error if file doesn't exist)
    await supabase.storage.from('avatars').remove([filePath]);

    // Set avatar_url to null in the profile
    await get().updateProfile({ avatar_url: null });
  },

  fetchAttorneyProfile: async (userId) => {
    const { data, error } = await supabase
      .from('attorney_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      set({ attorneyProfile: data as AttorneyProfile });
    }
  },

  updateAttorneyProfile: async (updates) => {
    const userId = get().user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('attorney_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('attorney_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq('id', userId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('attorney_profiles')
        .insert({ id: userId, ...updates } as never);
      if (error) throw error;
    }

    set((state) => ({
      attorneyProfile: state.attorneyProfile
        ? { ...state.attorneyProfile, ...updates }
        : null,
    }));

    await get().fetchAttorneyProfile(userId);
  },
}));
