import type { PricingType } from '@/types';

export interface PricingTypeOption {
  label: string;
  value: PricingType;
  description: string;
  unit: string;
}

export const PRICING_TYPES: PricingTypeOption[] = [
  { label: 'Flat Fee', value: 'flat_fee', description: 'One-time fixed price for the entire matter', unit: '$' },
  { label: 'Hourly', value: 'hourly', description: 'Billed per hour of work', unit: '$/hr' },
  { label: 'Retainer', value: 'retainer', description: 'Monthly retainer fee for ongoing services', unit: '$/mo' },
  { label: 'Contingency', value: 'contingency', description: 'Percentage of recovery, paid only if you win', unit: '%' },
];

export const PRICING_TYPE_MAP: Record<PricingType, PricingTypeOption> = Object.fromEntries(
  PRICING_TYPES.map((pt) => [pt.value, pt]),
) as Record<PricingType, PricingTypeOption>;

export const VALID_UNTIL_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
];
