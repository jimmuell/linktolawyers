# LinkToLawyers Development Plan

> Implementation checklist organized by phase. Check off items as completed.

---

## Current Status

- **Project Structure:** Single Expo app (spec describes monorepo - to be migrated later if needed)

---

## Phase 1: Foundation & Authentication

    
    ### 1.1 Project Setup

- [x] Initialize Expo project with TypeScript
- [x] Configure expo-router for file-based navigation
- [x] Set up Supabase for development
- [x] Configure environment variables
- [x] Set up ESLint
- [x] Install core dependencies (zustand, tanstack-query, react-hook-form, zod)
- [x] Create shared types file (`types/index.ts`)
- [x] Create validation schemas (`lib/validators.ts`)
- [x] Set up Supabase client (`lib/supabase.ts`)

### 1.2 Database Schema (Phase 1)

- [x] Create `profiles` table (extends auth.users)
- [x] Create `attorney_profiles` table
- [x] Create `push_tokens` table
- [x] Set up Row Level Security policies
- [x] Push migrations to remote database
- [x] Test database

### 1.3 Theme & Design System

- [x] Create theme context with light/dark/system modes
- [x] Implement theme persistence with AsyncStorage
- [x] Define color palette constants
- [x] Create base typography styles
- [x] Create reusable Button component
- [x] Create reusable TextInput component
- [x] Create reusable Card component

### 1.4 Authentication Screens

- [x] `(auth)/splash` - Splash screen with logo animation
- [x] `(auth)/onboarding` - Feature introduction slides (4 slides)
- [x] `(auth)/login` - Email/password login
- [x] `(auth)/register` - Registration with role selection
- [x] `(auth)/forgot-password` - Password reset flow

### 1.5 Authentication Logic

- [x] Email/password registration with Supabase Auth
- [x] Email/password login
- [x] Password reset via email
- [x] Role selection during signup (Client or Attorney)
- [x] Secure token storage (SQLite-backed localStorage via Supabase client)
- [x] Auto-login on app launch (session persistence)
- [x] Logout functionality
- [x] Auth state management (zustand store)
- [x] Protected route middleware

### 1.6 Profile Setup

- [x] Client profile form (name, contact info)
- [x] Attorney profile form (bar number, state, practice areas, bio)
- [x] Avatar upload functionality
- [x] Profile update API integration

### 1.7 Role-Based Navigation

- [x] `(client)/(tabs)` layout - Client tab navigation (Home, Requests, Messages, Profile)
- [x] `(attorney)/(tabs)` layout - Attorney tab navigation (Home, Browse, Quotes, Messages, Profile)
- [x] Redirect users based on role after login
- [x] Home dashboard (role-specific content)
- [x] Profile screen with settings access
- [x] Settings screen

### 1.8 Push Notifications

- [ ] Request push notification permissions
- [ ] Register push token with backend
- [ ] Store push tokens in database
- [ ] Handle notification received (foreground)
- [ ] Handle notification tap (background)

---

## Phase 2: Client Request System

### 2.1 Database Schema (Phase 2)

- [x] Create `requests` table
- [x] Create `request_attachments` table
- [x] Create `saved_requests` table
- [x] Create `hidden_requests` table
- [x] Set up RLS policies for requests

### 2.2 Client - Request Creation

- [x] `(client)/requests/new` - Multi-step wizard layout
- [x] Step 1: Practice area selection (searchable picker)
- [x] Step 2: Request details (title, description)
- [x] Step 3: Location preferences (state, city)
- [x] Step 4: Budget range (optional, min/max inputs)
- [x] Step 5: Document attachments (photos, PDFs)
- [x] Step 6: Review and submit
- [x] Form validation with zod
- [x] Draft saving functionality
- [x] Request submission to Supabase
- [x] Success confirmation screen

### 2.3 Client - Request Management

- [x] `(client)/requests/index` - Request list view
- [x] Status badges (draft, pending, quoted, etc.)
- [x] Pull-to-refresh
- [x] `(client)/requests/[id]` - Request detail view
- [x] Request status timeline visualization
- [x] Edit pending requests
- [x] Cancel/withdraw requests
- [x] Delete draft requests

### 2.4 Attorney - Browse Requests

- [x] `(attorney)/browse/index` - Available requests feed
- [x] Request card component (title, category, budget, date)
- [x] `(attorney)/browse/[id]` - Request detail view
- [x] Filter by practice area
- [x] Filter by location
- [x] Filter by budget range
- [x] Sort options (newest, budget, urgency)
- [x] Save/bookmark requests
- [x] Hide/dismiss requests
- [x] Quick quote button (navigates to quote form)

### 2.5 Notifications (Phase 2)

- [ ] New request matches notification (attorney)
- [ ] Request status change notification (client)

---

## Phase 3: Quoting Functionality

### 3.1 Database Schema (Phase 3)

- [x] Create `quotes` table
- [x] Create `quote_templates` table
- [x] Set up RLS policies for quotes

### 3.2 Attorney - Quote Creation

- [x] `(attorney)/quotes/new` - Quote creation form
- [x] Pricing type selection (flat fee, hourly, retainer, contingency)
- [x] Fee amount input
- [x] Scope of work (rich text)
- [x] Estimated timeline
- [x] Terms and conditions
- [x] Valid until date picker
- [x] Quote preview before submission
- [x] Submit quote to Supabase

### 3.3 Attorney - Quote Management

- [x] `(attorney)/quotes/index` - Submitted quotes dashboard
- [x] Quote status tracking (pending, viewed, accepted, declined, expired)
- [x] `(attorney)/quotes/[id]` - Quote detail view
- [x] Edit/revise quote
- [x] Withdraw quote
- [x] Quote templates system
- [x] `(attorney)/quotes/templates` - Manage templates

### 3.4 Client - Quote Review

- [x] `(client)/requests/[id]/quotes` - Quotes list for request
- [x] Quote card component (attorney info, price, status)
- [x] `(client)/quotes/[quoteId]` - Quote detail
- [x] Attorney profile quick view
- [x] `(client)/requests/[id]/compare` - Side-by-side comparison
- [x] Accept quote flow (confirmation modal, terms acceptance)
- [x] Decline quote with optional reason
- [x] Accepted quotes history

### 3.5 Notifications (Phase 3)

- [ ] New quote received notification (client)
- [ ] Quote viewed notification (attorney)
- [ ] Quote accepted/declined notification (attorney)
- [ ] Quote expiring soon notification (attorney)

---

## Phase 4: Communication & Messaging

### 4.1 Database Schema (Phase 4)

- [ ] Create `conversations` table
- [ ] Create `conversation_participants` table
- [ ] Create `messages` table
- [ ] Create `message_attachments` table
- [ ] Create `broadcasts` table (admin)
- [ ] Set up RLS policies for messaging
- [ ] Set up Supabase Realtime subscriptions

### 4.2 Conversations List

- [ ] `(tabs)/messages/index` - Conversation list screen
- [ ] Conversation card (avatar, name, last message, time, unread badge)
- [ ] Sort by recent activity
- [ ] Unread message count badge on tab
- [ ] Pull-to-refresh
- [ ] Search conversations

### 4.3 Chat Interface

- [ ] `(tabs)/messages/[conversationId]` - Chat view
- [ ] Message bubbles (sent/received styling)
- [ ] Timestamps
- [ ] Auto-scroll to bottom
- [ ] Load more (older messages)
- [ ] Typing indicators (Supabase Realtime)
- [ ] Read receipts
- [ ] Online status indicator

### 4.4 Message Types

- [ ] Text messages
- [ ] Image attachments (camera + gallery)
- [ ] Document attachments (PDF, etc.)
- [ ] System messages (quote accepted, case created, etc.)
- [ ] File preview before sending
- [ ] Image viewer (full screen)
- [ ] Document download

### 4.5 Message Threading

- [ ] Context-based conversations (request, quote, case)
- [ ] Show conversation context header
- [ ] Link to related request/quote/case

### 4.6 Realtime Features

- [ ] Supabase Realtime subscription for new messages
- [ ] Typing indicator broadcast
- [ ] Online presence tracking
- [ ] Optimistic UI updates

### 4.7 Notifications (Phase 4)

- [ ] New message push notification
- [ ] Notification tap opens specific conversation

---

## Phase 5: Consultation Scheduling

### 5.1 Database Schema (Phase 5)

- [ ] Create `attorney_availability` table
- [ ] Create `availability_overrides` table
- [ ] Create `consultations` table
- [ ] Create `consultation_reminders` table
- [ ] Set up RLS policies for scheduling

### 5.2 Attorney - Availability Management

- [ ] `(attorney)/schedule/index` - Schedule overview
- [ ] `(attorney)/schedule/availability` - Weekly schedule setup
- [ ] Day-of-week availability toggle
- [ ] Working hours per day (start/end time)
- [ ] Break times
- [ ] Time slot duration configuration (15, 30, 45, 60 min)
- [ ] Buffer time between appointments
- [ ] Custom availability overrides
- [ ] Vacation/blackout dates

### 5.3 Attorney - Appointments

- [ ] `(attorney)/schedule/appointments` - Appointment list
- [ ] Calendar view (day/week)
- [ ] Upcoming appointments section
- [ ] Appointment detail view
- [ ] Confirm/decline appointment requests
- [ ] Cancel with reason
- [ ] Reschedule appointment
- [ ] Device calendar sync (expo-calendar)
- [ ] Appointment reminder setup

### 5.4 Client - Book Consultation

- [ ] `(client)/consultations/book/[attorneyId]` - Booking flow
- [ ] Calendar date picker
- [ ] Available time slots display
- [ ] Consultation type selection (video, phone, in-person)
- [ ] Add notes/agenda
- [ ] Confirm booking
- [ ] Booking confirmation screen
- [ ] Add to device calendar option

### 5.5 Client - My Consultations

- [ ] `(client)/consultations/index` - Consultations list
- [ ] Upcoming appointments
- [ ] Past appointments
- [ ] `(client)/consultations/[id]` - Consultation detail
- [ ] Reschedule consultation
- [ ] Cancel consultation
- [ ] Meeting link display (for video calls)

### 5.6 Notifications (Phase 5)

- [ ] New booking request notification (attorney)
- [ ] Booking confirmed notification (client)
- [ ] Appointment reminder (24h, 1h before)
- [ ] Appointment cancelled notification

---

## Phase 6: Case Management & Polish

### 6.1 Database Schema (Phase 6)

- [ ] Create `cases` table
- [ ] Create `case_milestones` table
- [ ] Create `case_documents` table
- [ ] Create `case_notes` table
- [ ] Create `case_activities` table
- [ ] Create `reviews` table
- [ ] Create `platform_config` table
- [ ] Set up RLS policies for cases

### 6.2 Case Management

- [ ] Auto-create case on quote acceptance
- [ ] Generate unique case number
- [ ] `(tabs)/cases/index` - Cases list
- [ ] Active/Completed tabs
- [ ] Case search
- [ ] `(tabs)/cases/[id]` - Case detail view
- [ ] Case information card
- [ ] Participants display

### 6.3 Case Timeline

- [ ] `(tabs)/cases/[id]/timeline` - Activity timeline
- [ ] Chronological activity feed
- [ ] Status change events
- [ ] Milestone events
- [ ] Document added events
- [ ] Message events

### 6.4 Case Documents

- [ ] `(tabs)/cases/[id]/documents` - Document repository
- [ ] Upload documents (categorized)
- [ ] Document list by category
- [ ] Document preview
- [ ] Download documents
- [ ] Delete documents (with permission)

### 6.5 Case Status & Milestones (Attorney)

- [ ] Update case status
- [ ] Add milestones
- [ ] Mark milestones complete
- [ ] Add case notes (private/shared)
- [ ] Mark case complete
- [ ] Final document upload

### 6.6 Reviews

- [ ] `(tabs)/cases/[id]/review` - Leave review screen
- [ ] Star rating (1-5)
- [ ] Written review text
- [ ] Submit review
- [ ] View received reviews (attorney profile)
- [ ] Average rating display

### 6.7 Polish & Optimization

- [ ] Loading states and skeletons
- [ ] Error handling and retry logic
- [ ] Empty states for all lists
- [ ] Pull-to-refresh on all lists
- [ ] Optimistic updates
- [ ] Offline support for critical features
- [ ] Image optimization
- [ ] List virtualization (FlashList)
- [ ] Bundle size optimization

### 6.8 Accessibility

- [ ] VoiceOver support (iOS)
- [ ] TalkBack support (Android)
- [ ] Proper focus management
- [ ] Color contrast compliance
- [ ] Touch target sizes

### 6.9 Deep Linking

- [ ] Configure deep linking scheme
- [ ] Link to specific request
- [ ] Link to specific case
- [ ] Link to conversation
- [ ] Universal links setup

### 6.10 App Store Preparation

- [ ] App icon finalization
- [ ] Splash screen finalization
- [ ] iOS screenshots (all device sizes)
- [ ] Android screenshots (all device sizes)
- [ ] App Store description
- [ ] Google Play description
- [ ] Privacy policy
- [ ] Terms of service
- [ ] EAS Build configuration
- [ ] TestFlight build
- [ ] Internal testing track (Android)

---

## Admin Web App (Future Phase)

> Note: Admin web app will be built as separate Next.js app after mobile MVP

### Admin - Foundation
- [ ] Set up Next.js project with App Router
- [ ] Configure Tailwind CSS
- [ ] Install shadcn/ui components
- [ ] Set up Supabase SSR client
- [ ] Admin authentication (admin role check)
- [ ] Protected routes middleware
- [ ] Dashboard layout (sidebar navigation)

### Admin - User Management
- [ ] Users data table (search, filter, sort, paginate)
- [ ] User detail view
- [ ] Attorney verification workflow
- [ ] User suspension/activation
- [ ] Activity logs viewer

### Admin - Content Management
- [ ] Requests data table with moderation tools
- [ ] Quotes data table with oversight
- [ ] Cases data table with escalation queue
- [ ] Reviews moderation queue
- [ ] Flagged content management

### Admin - Messaging
- [ ] Message monitoring dashboard
- [ ] Flagged messages queue
- [ ] Broadcast messaging system

### Admin - Analytics
- [ ] User metrics dashboard
- [ ] Request/quote analytics
- [ ] Financial metrics
- [ ] Attorney performance metrics
- [ ] Case completion analytics
- [ ] Charts with Recharts

### Admin - Settings
- [ ] Platform configuration
- [ ] Fee structure settings
- [ ] Email templates
- [ ] Notification settings

---

## Technical Debt & Improvements

- [ ] Migrate to monorepo structure (Turborepo) if needed
- [ ] Extract shared packages (@linktolawyers/shared, validators, api-client)
- [ ] Add comprehensive error boundaries
- [ ] Add analytics tracking
- [ ] Add crash reporting (Sentry)
- [ ] Performance monitoring
- [ ] Automated testing setup (Jest/Vitest)
- [ ] E2E testing setup (Detox/Maestro)
- [ ] CI/CD pipeline (GitHub Actions + EAS)

---

## Quick Reference

### Run Commands
```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run lint       # Run ESLint
```

### Key Files
- `app/_layout.tsx` - Root navigation
- `contexts/theme-context.tsx` - Theme provider
- `lib/supabase.ts` - Supabase client
- `types/index.ts` - TypeScript types
- `lib/validators.ts` - Zod schemas

---

*Last Updated: February 2026*
