import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import type {
  HiddenRequest,
  Request,
  RequestAttachment,
  RequestAttachmentInsert,
  RequestInsert,
  RequestStatus,
  RequestWithClient,
  SavedRequest,
} from '@/types';

// Query keys
const requestKeys = {
  all: ['requests'] as const,
  clientList: (clientId: string, status?: RequestStatus) =>
    [...requestKeys.all, 'client', clientId, status] as const,
  detail: (id: string) => [...requestKeys.all, 'detail', id] as const,
  browse: (filters: BrowseFilters) => [...requestKeys.all, 'browse', filters] as const,
  saved: (attorneyId: string) => [...requestKeys.all, 'saved', attorneyId] as const,
  hidden: (attorneyId: string) => [...requestKeys.all, 'hidden', attorneyId] as const,
};

export interface BrowseFilters {
  practiceArea?: string;
  state?: string;
  budgetMax?: number;
  sort?: 'newest' | 'oldest' | 'budget_high' | 'budget_low';
}

// Client hooks

export function useClientRequests(statusFilter?: RequestStatus) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: requestKeys.clientList(userId ?? '', statusFilter),
    queryFn: async () => {
      let query = supabase
        .from('requests')
        .select('*')
        .eq('client_id', userId!)
        .order('updated_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Request[];
    },
    enabled: !!userId,
  });
}

export function useRequest(id: string | undefined) {
  return useQuery({
    queryKey: requestKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('*, profiles!client_id(full_name, avatar_url), request_attachments(*)' as '*')
        .eq('id', id!)
        .single();

      if (error) throw error;
      return data as unknown as RequestWithClient;
    },
    enabled: !!id,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (input: Omit<RequestInsert, 'client_id'>) => {
      const { data, error } = await supabase
        .from('requests')
        .insert({ ...input, client_id: userId! } as never)
        .select()
        .single();

      if (error) throw error;
      return data as Request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.clientList(userId ?? '') });
    },
  });
}

export function useUpdateRequest() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Request>) => {
      const { data, error } = await supabase
        .from('requests')
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Request;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.clientList(userId ?? '') });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: [...requestKeys.all, 'browse'] });
    },
  });
}

export function useCancelRequest() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() } as never)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.clientList(userId ?? '') });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(id) });
    },
  });
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete associated records first to avoid orphans
      await supabase.from('quotes').delete().eq('request_id', id);
      await supabase.from('request_attachments').delete().eq('request_id', id);
      await supabase.from('saved_requests').delete().eq('request_id', id);
      await supabase.from('hidden_requests').delete().eq('request_id', id);

      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', id)
        .eq('status', 'draft');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.clientList(userId ?? '') });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete associated records first to avoid orphans
      await supabase.from('quotes').delete().eq('request_id', id);
      await supabase.from('request_attachments').delete().eq('request_id', id);
      await supabase.from('saved_requests').delete().eq('request_id', id);
      await supabase.from('hidden_requests').delete().eq('request_id', id);

      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.clientList(userId ?? '') });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

// Attachment hooks

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      fileUri,
      fileName,
      fileType,
      fileSize,
    }: {
      requestId: string;
      fileUri: string;
      fileName: string;
      fileType: string;
      fileSize: number;
    }) => {
      const { readAsStringAsync } = await import('expo-file-system/legacy');
      const { decode } = await import('base64-arraybuffer');

      const base64 = await readAsStringAsync(fileUri, { encoding: 'base64' });
      const filePath = `${requestId}/${Date.now()}_${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('request-attachments')
        .upload(filePath, decode(base64), {
          contentType: fileType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('request-attachments')
        .getPublicUrl(filePath);

      const attachment: RequestAttachmentInsert = {
        request_id: requestId,
        file_url: urlData.publicUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
      };

      const { data, error } = await supabase
        .from('request_attachments')
        .insert(attachment as never)
        .select()
        .single();

      if (error) throw error;
      return data as RequestAttachment;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: requestKeys.detail(variables.requestId),
      });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, requestId }: { id: string; requestId: string }) => {
      const { error } = await supabase
        .from('request_attachments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return requestId;
    },
    onSuccess: (requestId) => {
      queryClient.invalidateQueries({
        queryKey: requestKeys.detail(requestId),
      });
    },
  });
}

// Attorney hooks

export function useBrowseRequests(filters: BrowseFilters) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: requestKeys.browse(filters),
    queryFn: async () => {
      let query = supabase
        .from('requests')
        .select('*, profiles!client_id(full_name, avatar_url)' as '*')
        .neq('status', 'draft')
        .neq('status', 'cancelled');

      if (filters.practiceArea) {
        query = query.eq('practice_area', filters.practiceArea);
      }
      if (filters.state) {
        query = query.eq('state', filters.state);
      }
      if (filters.budgetMax) {
        query = query.lte('budget_min', filters.budgetMax);
      }

      switch (filters.sort) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'budget_high':
          query = query.order('budget_max', { ascending: false, nullsFirst: false });
          break;
        case 'budget_low':
          query = query.order('budget_min', { ascending: true, nullsFirst: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as RequestWithClient[];
    },
    enabled: !!userId,
  });
}

export function useSavedRequests() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: requestKeys.saved(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_requests')
        .select('request_id')
        .eq('attorney_id', userId!);

      if (error) throw error;
      return new Set((data as SavedRequest[]).map((s) => s.request_id));
    },
    enabled: !!userId,
  });
}

export function useHiddenRequests() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: requestKeys.hidden(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hidden_requests')
        .select('request_id')
        .eq('attorney_id', userId!);

      if (error) throw error;
      return new Set((data as HiddenRequest[]).map((h) => h.request_id));
    },
    enabled: !!userId,
  });
}

export function useToggleSaveRequest() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({ requestId, isSaved }: { requestId: string; isSaved: boolean }) => {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_requests')
          .delete()
          .eq('attorney_id', userId!)
          .eq('request_id', requestId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saved_requests')
          .insert({ attorney_id: userId!, request_id: requestId } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.saved(userId ?? '') });
    },
  });
}

export function useHideRequest() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('hidden_requests')
        .insert({ attorney_id: userId!, request_id: requestId } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.hidden(userId ?? '') });
    },
  });
}
