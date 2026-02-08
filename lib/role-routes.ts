import type { UserRole } from '@/types';

/**
 * Returns the home path for a given user role.
 * Clients (and null/admin fallback) go to /(client)/(tabs).
 * Attorneys go to /(attorney)/(tabs).
 */
export function getRoleHomePath(role: UserRole | null | undefined): '/(client)/(tabs)' | '/(attorney)/(tabs)' {
  if (role === 'attorney') return '/(attorney)/(tabs)';
  return '/(client)/(tabs)';
}
