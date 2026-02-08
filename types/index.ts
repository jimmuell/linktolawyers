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

// Request system types
export type RequestUrgency = 'low' | 'normal' | 'high' | 'urgent';
export type RequestStatus = 'draft' | 'pending' | 'quoted' | 'accepted' | 'closed' | 'cancelled';

export interface Request {
  id: string;
  client_id: string;
  title: string;
  description: string;
  practice_area: string;
  state: string | null;
  city: string | null;
  budget_min: number | null;
  budget_max: number | null;
  urgency: RequestUrgency;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export type RequestInsert = Omit<Request, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RequestUpdate = Partial<Omit<Request, 'id' | 'client_id' | 'created_at'>> & {
  id: string;
};

export interface RequestAttachment {
  id: string;
  request_id: string;
  uploaded_by: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export type RequestAttachmentInsert = Omit<RequestAttachment, 'id' | 'uploaded_by' | 'created_at'> & {
  id?: string;
  uploaded_by?: string;
  created_at?: string;
};

export interface SavedRequest {
  attorney_id: string;
  request_id: string;
  created_at: string;
}

export interface HiddenRequest {
  attorney_id: string;
  request_id: string;
  created_at: string;
}

// Request with joined data for display
export interface RequestWithClient extends Request {
  profiles: Pick<Profile, 'full_name' | 'avatar_url'> | null;
  request_attachments?: RequestAttachment[];
}

// Quote system types
export type PricingType = 'flat_fee' | 'hourly' | 'retainer' | 'contingency';
export type QuoteStatus = 'draft' | 'submitted' | 'viewed' | 'accepted' | 'declined' | 'withdrawn' | 'expired';

export interface Quote {
  id: string;
  request_id: string;
  attorney_id: string;
  pricing_type: PricingType;
  fee_amount: number;
  estimated_hours: number | null;
  scope_of_work: string;
  estimated_timeline: string | null;
  terms: string | null;
  valid_until: string;
  status: QuoteStatus;
  decline_reason: string | null;
  viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type QuoteInsert = Omit<Quote, 'id' | 'status' | 'decline_reason' | 'viewed_at' | 'created_at' | 'updated_at'> & {
  id?: string;
  status?: QuoteStatus;
  decline_reason?: string | null;
  viewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type QuoteUpdate = Partial<Omit<Quote, 'id' | 'request_id' | 'attorney_id' | 'created_at'>> & {
  id: string;
};

export interface QuoteWithAttorney extends Quote {
  profiles: Pick<Profile, 'full_name' | 'avatar_url'> | null;
}

export interface QuoteWithRequest extends Quote {
  requests: Pick<Request, 'title' | 'practice_area' | 'status'> | null;
}

export interface QuoteTemplate {
  id: string;
  attorney_id: string;
  name: string;
  pricing_type: PricingType;
  fee_amount: number | null;
  estimated_hours: number | null;
  scope_of_work: string | null;
  estimated_timeline: string | null;
  terms: string | null;
  created_at: string;
  updated_at: string;
}

export type QuoteTemplateInsert = Omit<QuoteTemplate, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
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
      requests: {
        Row: Request;
        Insert: RequestInsert;
        Update: Partial<Omit<Request, 'id' | 'client_id' | 'created_at'>>;
        Relationships: [];
      };
      request_attachments: {
        Row: RequestAttachment;
        Insert: RequestAttachmentInsert;
        Update: Partial<Omit<RequestAttachment, 'id' | 'created_at'>>;
        Relationships: [];
      };
      saved_requests: {
        Row: SavedRequest;
        Insert: Omit<SavedRequest, 'created_at'>;
        Update: never;
        Relationships: [];
      };
      hidden_requests: {
        Row: HiddenRequest;
        Insert: Omit<HiddenRequest, 'created_at'>;
        Update: never;
        Relationships: [];
      };
      quotes: {
        Row: Quote;
        Insert: QuoteInsert;
        Update: Partial<Omit<Quote, 'id' | 'request_id' | 'attorney_id' | 'created_at'>>;
        Relationships: [];
      };
      quote_templates: {
        Row: QuoteTemplate;
        Insert: QuoteTemplateInsert;
        Update: Partial<Omit<QuoteTemplate, 'id' | 'attorney_id' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
  };
}
