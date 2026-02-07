export type UserRole = 'client' | 'attorney' | 'admin';

export interface Profile {
  id: string;
  updated_at: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
  role: UserRole | null;
}

export type ProfileInsert = Omit<Profile, 'updated_at'> & {
  updated_at?: string | null;
};

export type ProfileUpdate = Partial<Omit<Profile, 'id'>> & {
  id: string;
};

export interface AttorneyProfile {
  id: string;
  bar_number: string;
  bar_state: string;
  practice_areas: string[];
  years_of_experience: number | null;
  bio: string | null;
  hourly_rate: number | null;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AttorneyProfileInsert = Omit<AttorneyProfile, 'is_verified' | 'verified_at' | 'created_at' | 'updated_at'> & {
  is_verified?: boolean;
  verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AttorneyProfileUpdate = Partial<Omit<AttorneyProfile, 'id'>> & {
  id: string;
};

export type PushTokenPlatform = 'ios' | 'android' | 'web';

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: PushTokenPlatform;
  created_at: string;
  updated_at: string;
}

export type PushTokenInsert = Omit<PushToken, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PushTokenUpdate = Partial<Omit<PushToken, 'id'>> & {
  id: string;
};

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  profile: Profile | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      attorney_profiles: {
        Row: AttorneyProfile;
        Insert: AttorneyProfileInsert;
        Update: AttorneyProfileUpdate;
        Relationships: [];
      };
      push_tokens: {
        Row: PushToken;
        Insert: PushTokenInsert;
        Update: PushTokenUpdate;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
  };
}
