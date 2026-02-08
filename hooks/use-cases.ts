import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import type { CaseNote, CaseWithDetails, Profile, Quote, Request, Review } from '@/types';

export const caseKeys = {
  all: ['cases'] as const,
  list: (userId: string, status?: 'accepted' | 'closed' | 'archived') =>
    [...caseKeys.all, 'list', userId, status] as const,
  detail: (requestId: string) => [...caseKeys.all, 'detail', requestId] as const,
  archivedIds: (userId: string) => [...caseKeys.all, 'archivedIds', userId] as const,
  notes: (requestId: string) => [...caseKeys.all, 'notes', requestId] as const,
  review: (requestId: string) => [...caseKeys.all, 'review', requestId] as const,
  attorneyReviews: (attorneyId: string) =>
    [...caseKeys.all, 'attorneyReviews', attorneyId] as const,
};

// ─── Case list hooks ─────────────────────────────────────────────

export function useCases(
  role: 'client' | 'attorney',
  statusFilter?: 'accepted' | 'closed' | 'archived',
) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: caseKeys.list(userId ?? '', statusFilter),
    queryFn: async (): Promise<CaseWithDetails[]> => {
      if (role === 'client') {
        // Client: fetch own requests with accepted/closed status
        const statusValues = statusFilter ? [statusFilter] : ['accepted', 'closed'];
        const { data: requests, error: reqError } = await supabase
          .from('requests')
          .select('*')
          .eq('client_id', userId!)
          .in('status', statusValues)
          .order('updated_at', { ascending: false });

        if (reqError) throw reqError;
        if (!requests || requests.length === 0) return [];

        const requestIds = (requests as unknown as Request[]).map((r) => r.id);
        const { data: quotes, error: quoteError } = await supabase
          .from('quotes')
          .select('*, profiles!attorney_id(id, full_name, avatar_url)' as '*')
          .in('request_id', requestIds)
          .eq('status', 'accepted');

        if (quoteError) throw quoteError;

        type QuoteRow = Quote & {
          profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
        };
        const quoteMap = new Map<string, QuoteRow>();
        for (const q of (quotes as unknown as QuoteRow[])) {
          quoteMap.set(q.request_id, q);
        }

        return (requests as unknown as Request[])
          .filter((r) => quoteMap.has(r.id))
          .map((r) => {
            const q = quoteMap.get(r.id)!;
            return {
              request: r,
              quote: q,
              otherParty: q.profiles ?? { id: q.attorney_id, full_name: null, avatar_url: null },
            };
          });
      } else {
        // Attorney: fetch accepted quotes
        const { data: quotes, error: quoteError } = await supabase
          .from('quotes')
          .select('*')
          .eq('attorney_id', userId!)
          .eq('status', 'accepted');

        if (quoteError) throw quoteError;
        if (!quotes || quotes.length === 0) return [];

        // Fetch archived case IDs
        const { data: archived } = await supabase
          .from('archived_cases')
          .select('request_id')
          .eq('attorney_id', userId!);

        const archivedIds = new Set((archived ?? []).map((a: { request_id: string }) => a.request_id));

        const requestIds = (quotes as unknown as Quote[]).map((q) => q.request_id);

        // For 'archived' filter: only fetch closed+archived; otherwise fetch non-archived
        const statusValues = statusFilter === 'archived'
          ? ['closed']
          : statusFilter ? [statusFilter] : ['accepted', 'closed'];

        const { data: requests, error: reqError } = await supabase
          .from('requests')
          .select('*, profiles!client_id(id, full_name, avatar_url)' as '*')
          .in('id', requestIds)
          .in('status', statusValues)
          .order('updated_at', { ascending: false });

        if (reqError) throw reqError;
        if (!requests || requests.length === 0) return [];

        type RequestRow = Request & {
          profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
        };
        const quoteMap = new Map<string, Quote>();
        for (const q of (quotes as unknown as Quote[])) {
          quoteMap.set(q.request_id, q);
        }

        return (requests as unknown as RequestRow[])
          .filter((r) => {
            if (!quoteMap.has(r.id)) return false;
            if (statusFilter === 'archived') return archivedIds.has(r.id);
            return !archivedIds.has(r.id);
          })
          .map((r) => {
            const q = quoteMap.get(r.id)!;
            return {
              request: r,
              quote: q,
              otherParty: r.profiles ?? { id: r.client_id, full_name: null, avatar_url: null },
            };
          });
      }
    },
    enabled: !!userId,
  });
}

// ─── Single case detail hook ─────────────────────────────────────

export function useCaseDetail(requestId: string | undefined, role: 'client' | 'attorney') {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: caseKeys.detail(requestId ?? ''),
    queryFn: async (): Promise<(CaseWithDetails & { isArchived: boolean }) | null> => {
      // Fetch the request
      const { data: request, error: reqError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId!)
        .in('status', ['accepted', 'closed'])
        .single();

      if (reqError || !request) return null;

      // Fetch the accepted quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('request_id', requestId!)
        .eq('status', 'accepted')
        .single();

      if (quoteError || !quote) return null;

      // Fetch the other party's profile
      const otherPartyId = role === 'client'
        ? (quote as unknown as Quote).attorney_id
        : (request as unknown as Request).client_id;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', otherPartyId)
        .single();

      // Check archived status for attorneys
      let isArchived = false;
      if (role === 'attorney') {
        const { data: archived } = await supabase
          .from('archived_cases')
          .select('request_id')
          .eq('attorney_id', userId!)
          .eq('request_id', requestId!)
          .maybeSingle();
        isArchived = !!archived;
      }

      return {
        request: request as unknown as Request,
        quote: quote as unknown as Quote,
        otherParty: profile ?? { id: otherPartyId, full_name: null, avatar_url: null },
        isArchived,
      };
    },
    enabled: !!requestId && !!userId,
  });
}

// ─── Archive hooks ───────────────────────────────────────────────

export function useArchiveCase() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('archived_cases')
        .insert({ attorney_id: userId!, request_id: requestId } as never);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
    },
  });
}

export function useUnarchiveCase() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('archived_cases')
        .delete()
        .eq('attorney_id', userId!)
        .eq('request_id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
    },
  });
}

export function useDeleteArchivedCase() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({ requestId, quoteId }: { requestId: string; quoteId: string }) => {
      // Count other quotes (excluding the one being deleted) BEFORE deleting
      const { count } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('request_id', requestId)
        .neq('id', quoteId);

      // Revert request status BEFORE deleting the quote (RLS needs the quote to exist)
      const newStatus = (count ?? 0) > 0 ? 'quoted' : 'pending';
      await supabase
        .from('requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() } as never)
        .eq('id', requestId);

      // Delete the quote row
      const { error: quoteError } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId)
        .eq('attorney_id', userId!);

      if (quoteError) throw quoteError;

      // Clean up the archived_cases entry
      await supabase
        .from('archived_cases')
        .delete()
        .eq('attorney_id', userId!)
        .eq('request_id', requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

// ─── Case notes hooks ────────────────────────────────────────────

export interface CaseNoteWithAuthor extends CaseNote {
  profiles: Pick<Profile, 'full_name' | 'avatar_url'> | null;
}

export function useCaseNotes(requestId: string | undefined) {
  return useQuery({
    queryKey: caseKeys.notes(requestId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_notes')
        .select('*, profiles!user_id(full_name, avatar_url)' as '*')
        .eq('request_id', requestId!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as unknown as CaseNoteWithAuthor[];
    },
    enabled: !!requestId,
  });
}

export function useAddCaseNote() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({ requestId, content }: { requestId: string; content: string }) => {
      const { data, error } = await supabase
        .from('case_notes')
        .insert({ request_id: requestId, user_id: userId!, content } as never)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as CaseNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.notes(data.request_id) });
    },
  });
}

// ─── Close case hook ─────────────────────────────────────────────

export function useCloseCase() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase
        .from('requests')
        .update({ status: 'closed', updated_at: new Date().toISOString() } as never)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

// ─── Review hooks ────────────────────────────────────────────────

export function useCaseReview(requestId: string | undefined) {
  return useQuery({
    queryKey: caseKeys.review(requestId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('request_id', requestId!)
        .maybeSingle();

      if (error) throw error;
      return data as Review | null;
    },
    enabled: !!requestId,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      request_id: string;
      client_id: string;
      attorney_id: string;
      rating: number;
      comment: string | null;
    }) => {
      const { data, error } = await supabase
        .from('reviews')
        .insert(input as never)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Review;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.review(data.request_id) });
      queryClient.invalidateQueries({ queryKey: caseKeys.attorneyReviews(data.attorney_id) });
    },
  });
}

export function useAttorneyReviews(attorneyId: string | undefined) {
  return useQuery({
    queryKey: caseKeys.attorneyReviews(attorneyId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles!client_id(full_name, avatar_url)' as '*')
        .eq('attorney_id', attorneyId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as (Review & {
        profiles: Pick<Profile, 'full_name' | 'avatar_url'> | null;
      })[];
    },
    enabled: !!attorneyId,
  });
}
