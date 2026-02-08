import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import type {
  Quote,
  QuoteStatus,
  QuoteTemplate,
  QuoteTemplateInsert,
  QuoteWithAttorney,
  QuoteWithRequest,
} from '@/types';

// Query keys
export const quoteKeys = {
  all: ['quotes'] as const,
  attorneyList: (attorneyId: string, status?: QuoteStatus) =>
    [...quoteKeys.all, 'attorney', attorneyId, status] as const,
  requestQuotes: (requestId: string) =>
    [...quoteKeys.all, 'request', requestId] as const,
  detail: (id: string) => [...quoteKeys.all, 'detail', id] as const,
  myQuoteForRequest: (requestId: string, attorneyId: string) =>
    [...quoteKeys.all, 'myQuote', requestId, attorneyId] as const,
  templates: (attorneyId: string) =>
    [...quoteKeys.all, 'templates', attorneyId] as const,
};

// ─── Attorney hooks ──────────────────────────────────────────────

export function useAttorneyQuotes(statusFilter?: QuoteStatus) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: quoteKeys.attorneyList(userId ?? '', statusFilter),
    queryFn: async () => {
      let query = supabase
        .from('quotes')
        .select('*, requests!request_id(title, practice_area, status)' as '*')
        .eq('attorney_id', userId!)
        .order('updated_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as QuoteWithRequest[];
    },
    enabled: !!userId,
  });
}

export function useQuote(id: string | undefined) {
  return useQuery({
    queryKey: quoteKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*, requests!request_id(title, practice_area, status, client_id, description, state, city, budget_min, budget_max, urgency, created_at), profiles!attorney_id(full_name, avatar_url)' as '*')
        .eq('id', id!)
        .single();

      if (error) throw error;
      return data as unknown as Quote & {
        requests: {
          title: string;
          practice_area: string;
          status: string;
          client_id: string;
          description: string;
          state: string | null;
          city: string | null;
          budget_min: number | null;
          budget_max: number | null;
          urgency: string;
          created_at: string;
        } | null;
        profiles: { full_name: string | null; avatar_url: string | null } | null;
      };
    },
    enabled: !!id,
  });
}

export function useMyQuoteForRequest(requestId: string | undefined) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: quoteKeys.myQuoteForRequest(requestId ?? '', userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('request_id', requestId!)
        .eq('attorney_id', userId!)
        .maybeSingle();

      if (error) throw error;
      return data as Quote | null;
    },
    enabled: !!requestId && !!userId,
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (input: {
      request_id: string;
      pricing_type: string;
      fee_amount: number;
      estimated_hours: number | null;
      scope_of_work: string;
      estimated_timeline: string | null;
      terms: string | null;
      valid_until: string;
    }) => {
      const payload = { ...input, attorney_id: userId! };
      console.log('[useCreateQuote] inserting:', JSON.stringify(payload));
      const { data, error } = await supabase
        .from('quotes')
        .insert(payload as never)
        .select()
        .single();

      if (error) {
        console.error('[useCreateQuote] error:', JSON.stringify(error));
        throw error;
      }
      return data as Quote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.attorneyList(userId ?? '') });
      queryClient.invalidateQueries({ queryKey: quoteKeys.myQuoteForRequest(data.request_id, userId ?? '') });
      queryClient.invalidateQueries({ queryKey: quoteKeys.requestQuotes(data.request_id) });
      // Invalidate all request queries so status updates (from DB trigger) are reflected
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Quote>) => {
      const { data, error } = await supabase
        .from('quotes')
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Quote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.attorneyList(userId ?? '') });
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.requestQuotes(data.request_id) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.myQuoteForRequest(data.request_id, userId ?? '') });
    },
  });
}

export function useWithdrawQuote() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch the quote first so we have the request_id for status revert
      const { data: quoteRow, error: fetchError } = await supabase
        .from('quotes')
        .select('id, request_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      const quote = quoteRow as unknown as { id: string; request_id: string };

      // Count other quotes (excluding the one being withdrawn) BEFORE deleting
      const { count } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('request_id', quote.request_id)
        .neq('id', id);

      // Revert request status BEFORE deleting the quote (RLS needs the quote to exist)
      const newStatus = (count ?? 0) > 0 ? 'quoted' : 'pending';
      await supabase
        .from('requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() } as never)
        .eq('id', quote.request_id);

      // Delete the quote row
      const { error: deleteError } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id)
        .eq('attorney_id', userId!);

      if (deleteError) throw deleteError;

      return { id, request_id: quote.request_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.attorneyList(userId ?? '') });
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.requestQuotes(data.request_id) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.myQuoteForRequest(data.request_id, userId ?? '') });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

// ─── Client hooks ─────────────────────────────────────────────────

export function useRequestQuotes(requestId: string | undefined) {
  return useQuery({
    queryKey: quoteKeys.requestQuotes(requestId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*, profiles!attorney_id(full_name, avatar_url)' as '*')
        .eq('request_id', requestId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as QuoteWithAttorney[];
    },
    enabled: !!requestId,
  });
}

export function useAcceptQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('quotes')
        .update({ status: 'accepted', updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Quote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.requestQuotes(data.request_id) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

export function useDeclineQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('quotes')
        .update({
          status: 'declined',
          decline_reason: reason ?? null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Quote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.requestQuotes(data.request_id) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(data.id) });
    },
  });
}

export function useMarkQuoteViewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('quotes')
        .update({
          status: 'viewed',
          viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .eq('status', 'submitted')
        .select()
        .single();

      if (error) {
        // Not an error if quote is already viewed
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as Quote;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: quoteKeys.requestQuotes(data.request_id) });
        queryClient.invalidateQueries({ queryKey: quoteKeys.detail(data.id) });
      }
    },
  });
}

// ─── Accepted quotes for client ─────────────────────────────────

export interface AcceptedQuoteInfo {
  attorney_name: string | null;
  pricing_type: Quote['pricing_type'];
  fee_amount: number;
  estimated_hours: number | null;
}

export function useAcceptedQuotes() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: [...quoteKeys.all, 'accepted', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*, requests!request_id(id, client_id), profiles!attorney_id(full_name, avatar_url)' as '*')
        .eq('status', 'accepted')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      type QuoteRow = Quote & {
        requests: { id: string; client_id: string } | null;
        profiles: { full_name: string | null; avatar_url: string | null } | null;
      };
      const filtered = (data as unknown as QuoteRow[]).filter((q) => q.requests?.client_id === userId);
      const map = new Map<string, AcceptedQuoteInfo>();
      for (const q of filtered) {
        if (q.requests) {
          map.set(q.requests.id, {
            attorney_name: q.profiles?.full_name ?? null,
            pricing_type: q.pricing_type,
            fee_amount: q.fee_amount,
            estimated_hours: q.estimated_hours,
          });
        }
      }
      return map;
    },
    enabled: !!userId,
  });
}

// ─── Template hooks ───────────────────────────────────────────────

export function useQuoteTemplates() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: quoteKeys.templates(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_templates')
        .select('*')
        .eq('attorney_id', userId!)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as QuoteTemplate[];
    },
    enabled: !!userId,
  });
}

export function useSaveTemplate() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (input: Omit<QuoteTemplateInsert, 'attorney_id'>) => {
      const { data, error } = await supabase
        .from('quote_templates')
        .insert({ ...input, attorney_id: userId! } as never)
        .select()
        .single();

      if (error) throw error;
      return data as QuoteTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.templates(userId ?? '') });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Omit<QuoteTemplate, 'id' | 'attorney_id' | 'created_at'>>) => {
      const { data, error } = await supabase
        .from('quote_templates')
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as QuoteTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.templates(userId ?? '') });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quote_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.templates(userId ?? '') });
    },
  });
}
