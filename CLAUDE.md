# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LinkToLawyers is a React Native/Expo universal app (iOS, Android, Web) using Expo SDK 54, React 19, and Expo Router v6 for file-based routing.

## Commands

```bash
npm start              # Start Expo dev server (interactive menu)
npm run ios            # Start on iOS simulator
npm run android        # Start on Android emulator
npm run web            # Start on web
npm run lint           # Run ESLint
npm run reset-project  # Move current app/ to app-example/ and create blank app
```

EAS builds:
```bash
eas build --profile development --platform ios
eas build --profile preview --platform ios
eas build --profile production --platform ios
```

## Architecture

**Routing**: File-based routing via Expo Router. Routes live in `app/`. The root layout (`app/_layout.tsx`) wraps the app in QueryClientProvider > ThemeProvider > AuthProvider > NavigationThemeWrapper > ProtectedRouteGuard > Stack. The app starts at `app/index.tsx` which redirects to `/(auth)/splash`. The splash screen checks auth state and role, routing authenticated users to `/(client)/(tabs)` or `/(attorney)/(tabs)` via `getRoleHomePath()` from `lib/role-routes.ts`. The `(auth)` group contains splash, onboarding, login, register, and forgot-password screens. The `(client)` group uses a Stack layout wrapping `(tabs)` (4 tabs: Home, Requests, Cases, Messages) plus `requests/new` (modal), `requests/[id]`, `requests/[id]/quotes`, `quotes/[quoteId]`, and `cases/[id]` screens. The `(attorney)` group uses a Stack layout wrapping `(tabs)` (5 tabs: Home, Browse, Quotes, Messages, Cases) plus `browse/[id]`, `quotes/new` (modal), `quotes/[id]`, and `cases/[id]` screens. Profile is a root-level modal route (`app/profile.tsx`, `presentation: 'modal'`) opened via the `ProfileButton` avatar in tab headers; it shows a read-only overview with navigation to `edit-basic-info`, `edit-attorney-profile`, `availability`, and `notifications` modal routes. A `ProtectedRouteGuard` in the root layout redirects unauthenticated users away from `(client)` and `(attorney)` groups. **Messaging is integrated into request and case detail screens** via a "Details" / "Chat" `SegmentedControl` tab — there are no standalone chat routes. The Messages tab acts as an alert/inbox list; tapping a conversation navigates to the relevant case or request detail with `initialTab=chat`. The `ChatPanel` component (`components/ui/chat-panel.tsx`) provides the reusable embedded chat UI with lazy conversation creation, realtime messages, and typing indicators.

**Theming**: Centralized in `constants/theme.ts` with light/dark color definitions. Components use `useThemeColor()` hook and themed wrappers (`ThemedText`, `ThemedView`). Platform-specific hooks exist (e.g., `use-color-scheme.web.ts`).

**Platform-specific files**: Uses `.ios.tsx` and `.web.ts` suffixes for platform variants (e.g., `icon-symbol.ios.tsx` uses SF Symbols, the default uses MaterialIcons).

**Path aliases**: `@/*` maps to the project root (configured in `tsconfig.json`).

**Backend**: Supabase for auth, database, and storage. Client configured in `lib/supabase.ts` with SQLite-backed `localStorage` for session persistence on native. Environment variables in `.env.local` (gitignored); see `.env.example` for template.

**State Management**:
- Server state: TanStack React Query (`QueryClientProvider` in root layout)
- Client state: Zustand (stores in `stores/`)
- Form state: react-hook-form + Zod validation schemas (`lib/validators.ts`)

**Database**: Supabase Postgres with tables: `profiles` (id, updated_at, username, full_name, avatar_url, website, role), `requests` (id, client_id, title, description, practice_area, state, city, budget_min, budget_max, urgency, status, created_at, updated_at), `request_attachments` (id, request_id, file_url, file_name, file_type, file_size, created_at), `saved_requests` (attorney_id, request_id), `hidden_requests` (attorney_id, request_id), `quotes` (id, request_id, attorney_id, pricing_type, fee_amount, estimated_hours, scope_of_work, estimated_timeline, terms, valid_until, status, decline_reason, viewed_at, created_at, updated_at) with `UNIQUE(request_id, attorney_id)`, `quote_templates` (id, attorney_id, name, pricing_type, fee_amount, estimated_hours, scope_of_work, estimated_timeline, terms, created_at, updated_at). The `role` column uses a `user_role` enum (`'client' | 'attorney'`). The `urgency` column uses `request_urgency` enum, `status` uses `request_status` enum. The `pricing_type` column uses `pricing_type` enum (`flat_fee | hourly | retainer | contingency`), `quote status` uses `quote_status` enum (`draft | submitted | viewed | accepted | declined | withdrawn | expired`). A DB trigger `update_request_status_on_quote()` auto-updates request status to `quoted` on first quote insert and to `accepted` when a quote is accepted (also auto-declines other quotes). Case management: `case_notes` (id, request_id, user_id, content, created_at) stores activity feed notes for active/closed cases, `reviews` (id, request_id, client_id, attorney_id, rating 1-5, comment, created_at, UNIQUE on request_id) stores client ratings after case closure. An accepted request represents an active case; attorneys can close accepted cases via RLS policy. Messaging: `conversations` (id, request_id, client_id, attorney_id, last_message_text, last_message_at, created_at) with `UNIQUE(client_id, attorney_id, request_id)`, `messages` (id, conversation_id, sender_id, content, is_system, read_at, created_at), `message_attachments` (id, message_id, file_url, file_name, file_type, file_size, width, height, created_at) for images/PDFs attached to messages, `conversation_read_cursors` (conversation_id, user_id PK, last_read_at). A DB trigger `on_message_insert` auto-updates `conversations.last_message_text` and `last_message_at`. Supabase Realtime enabled on `messages` table for live message delivery; typing indicators use Realtime Broadcast; online presence uses Supabase Realtime Presence on a global `presence:app` channel. Storage bucket `message-attachments` stores uploaded chat files.

**Auth**: Supabase Auth with Zustand store (`stores/auth-store.ts`) for signIn/signUp/signOut/resetPassword. Auth context (`contexts/auth-context.tsx`) listens to `onAuthStateChange` and provides `isInitialized`/`isAuthenticated`. Session persisted via SQLite-backed localStorage.

### Key Files

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Supabase client singleton |
| `lib/validators.ts` | Zod schemas for forms (auth, profile, requests) |
| `types/index.ts` | Shared TypeScript types & Database type |
| `stores/auth-store.ts` | Zustand auth store (session, user, profile, auth methods) |
| `contexts/auth-context.tsx` | Auth context provider with Supabase session listener |
| `lib/role-routes.ts` | `getRoleHomePath(role)` — role-to-route mapping |
| `hooks/use-requests.ts` | React Query hooks for requests (client CRUD, attorney browse, save/hide) |
| `hooks/use-quotes.ts` | React Query hooks for quotes (attorney CRUD, client review, templates) |
| `hooks/use-cases.ts` | React Query hooks for cases (list, notes, close, reviews) |
| `hooks/use-messages.ts` | React Query hooks for conversations and messages (list, send, create, read cursors, unread count, attachment upload) |
| `hooks/use-realtime-messages.ts` | Supabase Realtime hooks for live messages and typing indicators |
| `hooks/use-presence.ts` | Supabase Realtime Presence hook for online status tracking |
| `stores/unread-store.ts` | Zustand store for total unread message count (synced to tab badge) |
| `stores/presence-store.ts` | Zustand store for online user IDs (global presence channel) |
| `hooks/use-push-notifications.ts` | Expo push token registration, permission handling, and notification tap → navigation |
| `supabase/functions/send-push-notification/index.ts` | Supabase Edge Function that sends Expo push notifications to recipient devices |
| `constants/practice-areas.ts` | Legal practice area options |
| `constants/us-states.ts` | US states with abbreviations |
| `constants/pricing-types.ts` | Pricing type options (flat_fee, hourly, retainer, contingency) and valid-until options |
| `components/screens/profile-screen.tsx` | Shared profile screen (used by both client & attorney tabs) |
| `components/screens/create-request-wizard.tsx` | Multi-step request creation wizard |
| `components/screens/request-detail-screen.tsx` | Shared request detail view (client & attorney variants) |
| `components/screens/create-quote-form.tsx` | Single scrollable quote creation form with preview modal |
| `components/screens/quote-detail-screen.tsx` | Shared quote detail view (client & attorney variants) |
| `components/screens/case-detail-screen.tsx` | Shared case detail view with notes feed and review (client & attorney variants) |
| `components/screens/conversations-list-screen.tsx` | Shared conversations list (alert/inbox); tapping navigates to case/request detail with chat tab |
| `components/ui/chat-panel.tsx` | Reusable embedded chat panel with lazy conversation creation, realtime messages, typing indicators, image/doc attachments, online presence banner |
| `components/ui/image-viewer.tsx` | Full-screen image viewer modal with pinch-to-zoom and share |
| `components/ui/segmented-control.tsx` | Details/Chat tab toggle used in case and request detail screens |
| `app/_layout.tsx` | Root layout with providers + ProtectedRouteGuard |
| `app/index.tsx` | Entry point, redirects to auth splash |

## Key Conventions

- TypeScript strict mode is enabled
- React 19 compiler and New Architecture are enabled
- Typed routes experiment is enabled (`typedRoutes: true` in app.json)
- iOS bundle ID: `com.jimmuell.linktolawyers`
- EAS project ID: `e5e360be-4b42-4bfd-9c73-983ace899aa7`
- App version source is `remote` (managed by EAS)
- VS Code auto-fixes, organizes imports, and sorts members on save

## Task Tracking

- When completing work on a feature or phase, **immediately check off the corresponding items** in `docs/DEVELOPMENT_PLAN.md` (change `- [ ]` to `- [x]`).
- Do not wait until the end — mark tasks done as soon as they are implemented, tested (`tsc` + `lint` pass), and verified.
- Keep CLAUDE.md architecture section up to date when adding new providers, stores, or changing routing.

## SQL Migrations

### Add role column to profiles (run in Supabase SQL Editor)

```sql
CREATE TYPE user_role AS ENUM ('client', 'attorney');
ALTER TABLE public.profiles ADD COLUMN role user_role;
CREATE INDEX idx_profiles_role ON public.profiles (role);
```

### Phase 2: Request system tables (run in Supabase SQL Editor)

```sql
-- Enums
CREATE TYPE request_urgency AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE request_status AS ENUM ('draft', 'pending', 'quoted', 'accepted', 'closed', 'cancelled');

-- Requests table
CREATE TABLE public.requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  practice_area text NOT NULL,
  state text,
  city text,
  budget_min integer,
  budget_max integer,
  urgency request_urgency DEFAULT 'normal' NOT NULL,
  status request_status DEFAULT 'draft' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_requests_client ON public.requests (client_id);
CREATE INDEX idx_requests_status ON public.requests (status);
CREATE INDEX idx_requests_practice_area ON public.requests (practice_area);
CREATE INDEX idx_requests_created ON public.requests (created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER requests_updated_at
  BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Request attachments
CREATE TABLE public.request_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_request_attachments_request ON public.request_attachments (request_id);

-- Saved requests (attorney bookmarks)
CREATE TABLE public.saved_requests (
  attorney_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (attorney_id, request_id)
);

-- Hidden requests (attorney dismissals)
CREATE TABLE public.hidden_requests (
  attorney_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (attorney_id, request_id)
);

-- RLS policies
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_requests ENABLE ROW LEVEL SECURITY;

-- Clients: full CRUD on own requests
CREATE POLICY "Clients can view own requests"
  ON public.requests FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Clients can create requests"
  ON public.requests FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own requests"
  ON public.requests FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete own draft requests"
  ON public.requests FOR DELETE USING (auth.uid() = client_id AND status = 'draft');

-- Attorneys: read non-draft requests
CREATE POLICY "Attorneys can view non-draft requests"
  ON public.requests FOR SELECT USING (
    status != 'draft'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'attorney')
  );

-- Attachments: follow request access
CREATE POLICY "Users can view attachments of accessible requests"
  ON public.request_attachments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.requests WHERE id = request_id AND (client_id = auth.uid() OR status != 'draft'))
  );

CREATE POLICY "Clients can add attachments to own requests"
  ON public.request_attachments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.requests WHERE id = request_id AND client_id = auth.uid())
  );

-- Saved requests: attorneys manage own
CREATE POLICY "Attorneys can view own saved"
  ON public.saved_requests FOR SELECT USING (auth.uid() = attorney_id);

CREATE POLICY "Attorneys can save requests"
  ON public.saved_requests FOR INSERT WITH CHECK (auth.uid() = attorney_id);

CREATE POLICY "Attorneys can unsave requests"
  ON public.saved_requests FOR DELETE USING (auth.uid() = attorney_id);

-- Hidden requests: attorneys manage own
CREATE POLICY "Attorneys can view own hidden"
  ON public.hidden_requests FOR SELECT USING (auth.uid() = attorney_id);

CREATE POLICY "Attorneys can hide requests"
  ON public.hidden_requests FOR INSERT WITH CHECK (auth.uid() = attorney_id);

CREATE POLICY "Attorneys can unhide requests"
  ON public.hidden_requests FOR DELETE USING (auth.uid() = attorney_id);

-- Storage bucket for request attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('request-attachments', 'request-attachments', true);

CREATE POLICY "Users can upload request attachments"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'request-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view request attachments"
  ON storage.objects FOR SELECT USING (bucket_id = 'request-attachments');
```

### Phase 3: Quoting system tables (run in Supabase SQL Editor)

```sql
-- Enums
CREATE TYPE pricing_type AS ENUM ('flat_fee', 'hourly', 'retainer', 'contingency');
CREATE TYPE quote_status AS ENUM ('draft', 'submitted', 'viewed', 'accepted', 'declined', 'withdrawn', 'expired');

-- Quotes table
CREATE TABLE public.quotes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  attorney_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pricing_type pricing_type NOT NULL,
  fee_amount numeric(12,2) NOT NULL,
  estimated_hours numeric(6,1),
  scope_of_work text NOT NULL,
  estimated_timeline text,
  terms text,
  valid_until timestamptz NOT NULL,
  status quote_status DEFAULT 'submitted' NOT NULL,
  decline_reason text,
  viewed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(request_id, attorney_id)
);

CREATE INDEX idx_quotes_request ON public.quotes (request_id);
CREATE INDEX idx_quotes_attorney ON public.quotes (attorney_id);
CREATE INDEX idx_quotes_status ON public.quotes (status);

CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Quote templates table
CREATE TABLE public.quote_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  attorney_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  pricing_type pricing_type NOT NULL,
  fee_amount numeric(12,2),
  estimated_hours numeric(6,1),
  scope_of_work text,
  estimated_timeline text,
  terms text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_quote_templates_attorney ON public.quote_templates (attorney_id);

CREATE TRIGGER quote_templates_updated_at
  BEFORE UPDATE ON public.quote_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attorneys can view own quotes"
  ON public.quotes FOR SELECT USING (auth.uid() = attorney_id);
CREATE POLICY "Attorneys can create quotes"
  ON public.quotes FOR INSERT WITH CHECK (auth.uid() = attorney_id);
CREATE POLICY "Attorneys can update own quotes"
  ON public.quotes FOR UPDATE USING (auth.uid() = attorney_id);
CREATE POLICY "Clients can view quotes on own requests"
  ON public.quotes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.requests WHERE id = request_id AND client_id = auth.uid())
  );
CREATE POLICY "Clients can update quotes on own requests"
  ON public.quotes FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.requests WHERE id = request_id AND client_id = auth.uid())
  );

CREATE POLICY "Attorneys can view own templates"
  ON public.quote_templates FOR SELECT USING (auth.uid() = attorney_id);
CREATE POLICY "Attorneys can create templates"
  ON public.quote_templates FOR INSERT WITH CHECK (auth.uid() = attorney_id);
CREATE POLICY "Attorneys can update own templates"
  ON public.quote_templates FOR UPDATE USING (auth.uid() = attorney_id);
CREATE POLICY "Attorneys can delete own templates"
  ON public.quote_templates FOR DELETE USING (auth.uid() = attorney_id);

-- Trigger: auto-update request status on quote changes
CREATE OR REPLACE FUNCTION update_request_status_on_quote()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.requests SET status = 'quoted', updated_at = now()
    WHERE id = NEW.request_id AND status = 'pending';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    UPDATE public.requests SET status = 'accepted', updated_at = now()
    WHERE id = NEW.request_id;
    UPDATE public.quotes SET status = 'declined', decline_reason = 'Another quote was accepted', updated_at = now()
    WHERE request_id = NEW.request_id AND id != NEW.id AND status IN ('submitted', 'viewed');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_quote_change
  AFTER INSERT OR UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION update_request_status_on_quote();
```

### Phase 4 (Case Management): case_notes and reviews tables (run in Supabase SQL Editor)

```sql
-- Case notes (activity feed for active cases)
CREATE TABLE public.case_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_case_notes_request ON public.case_notes (request_id);
CREATE INDEX idx_case_notes_created ON public.case_notes (created_at);

ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Case participants can view notes"
  ON public.case_notes FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_id AND (
        r.client_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.quotes q WHERE q.request_id = r.id AND q.attorney_id = auth.uid() AND q.status = 'accepted')
      )
    )
  );

CREATE POLICY "Case participants can add notes"
  ON public.case_notes FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_id AND r.status IN ('accepted', 'closed') AND (
        r.client_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.quotes q WHERE q.request_id = r.id AND q.attorney_id = auth.uid() AND q.status = 'accepted')
      )
    )
  );

-- Reviews (client rates attorney after case closure)
CREATE TABLE public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL UNIQUE,
  client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  attorney_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_reviews_attorney ON public.reviews (attorney_id);
CREATE INDEX idx_reviews_client ON public.reviews (client_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Clients can create reviews for closed cases"
  ON public.reviews FOR INSERT WITH CHECK (
    auth.uid() = client_id AND
    EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND r.client_id = auth.uid() AND r.status = 'closed')
  );

-- Helper function to avoid RLS recursion (requests ↔ quotes)
CREATE OR REPLACE FUNCTION public.attorney_has_accepted_quote(req_id uuid, att_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.quotes
    WHERE request_id = req_id AND attorney_id = att_id AND status = 'accepted'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Allow attorneys to close accepted cases they're assigned to
CREATE POLICY "Attorneys can close accepted cases"
  ON public.requests FOR UPDATE USING (
    status = 'accepted' AND
    public.attorney_has_accepted_quote(id, auth.uid())
  ) WITH CHECK (
    status = 'closed'
  );
```

### Phase 4 (Messaging): conversations, messages, and read cursors (run in Supabase SQL Editor)

```sql
-- Conversations table
CREATE TABLE public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid REFERENCES public.requests(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  attorney_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_text text,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(client_id, attorney_id, request_id)
);

CREATE INDEX idx_conversations_client ON public.conversations (client_id);
CREATE INDEX idx_conversations_attorney ON public.conversations (attorney_id);
CREATE INDEX idx_conversations_last_message ON public.conversations (last_message_at DESC NULLS LAST);

-- Messages table
CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_system boolean DEFAULT false NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_messages_conversation ON public.messages (conversation_id);
CREATE INDEX idx_messages_created ON public.messages (created_at DESC);

-- Read cursors
CREATE TABLE public.conversation_read_cursors (
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  last_read_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (conversation_id, user_id)
);

-- Trigger: auto-update conversation on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_text = NEW.content, last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_read_cursors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view own conversations"
  ON public.conversations FOR SELECT USING (
    auth.uid() = client_id OR auth.uid() = attorney_id
  );

CREATE POLICY "Participants can create conversations"
  ON public.conversations FOR INSERT WITH CHECK (
    auth.uid() = client_id OR auth.uid() = attorney_id
  );

CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND (client_id = auth.uid() OR attorney_id = auth.uid())
    )
  );

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND (client_id = auth.uid() OR attorney_id = auth.uid())
    )
  );

CREATE POLICY "Users can view own read cursors"
  ON public.conversation_read_cursors FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own read cursors"
  ON public.conversation_read_cursors FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own read cursors"
  ON public.conversation_read_cursors FOR UPDATE USING (auth.uid() = user_id);

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

### Phase 4 (Message Attachments): message_attachments table and storage bucket (run in Supabase SQL Editor)

```sql
-- Message attachments table
CREATE TABLE public.message_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  width integer,
  height integer,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_message_attachments_message ON public.message_attachments (message_id);

ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view message attachments"
  ON public.message_attachments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id
      AND (c.client_id = auth.uid() OR c.attorney_id = auth.uid())
    )
  );

CREATE POLICY "Participants can add message attachments"
  ON public.message_attachments FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id
      AND (c.client_id = auth.uid() OR c.attorney_id = auth.uid())
    )
  );

CREATE POLICY "Message sender can delete attachments"
  ON public.message_attachments FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id AND m.sender_id = auth.uid()
    )
  );

-- Storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('message-attachments', 'message-attachments', true);

CREATE POLICY "Users can upload message attachments"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view message attachments"
  ON storage.objects FOR SELECT USING (bucket_id = 'message-attachments');
```
