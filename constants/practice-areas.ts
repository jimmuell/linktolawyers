export interface PracticeArea {
  label: string;
  value: string;
}

export const PRACTICE_AREAS: PracticeArea[] = [
  { label: 'Bankruptcy', value: 'bankruptcy' },
  { label: 'Business Law', value: 'business_law' },
  { label: 'Civil Litigation', value: 'civil_litigation' },
  { label: 'Consumer Protection', value: 'consumer_protection' },
  { label: 'Criminal Defense', value: 'criminal_defense' },
  { label: 'DUI / DWI', value: 'dui_dwi' },
  { label: 'Elder Law', value: 'elder_law' },
  { label: 'Employment Law', value: 'employment_law' },
  { label: 'Estate Planning', value: 'estate_planning' },
  { label: 'Family Law', value: 'family_law' },
  { label: 'Immigration', value: 'immigration' },
  { label: 'Intellectual Property', value: 'intellectual_property' },
  { label: 'Landlord / Tenant', value: 'landlord_tenant' },
  { label: 'Medical Malpractice', value: 'medical_malpractice' },
  { label: 'Personal Injury', value: 'personal_injury' },
  { label: 'Real Estate', value: 'real_estate' },
  { label: 'Tax Law', value: 'tax_law' },
  { label: 'Traffic Violations', value: 'traffic_violations' },
  { label: 'Workers Compensation', value: 'workers_compensation' },
  { label: 'Other', value: 'other' },
];

export const PRACTICE_AREA_MAP = Object.fromEntries(
  PRACTICE_AREAS.map((pa) => [pa.value, pa.label]),
) as Record<string, string>;
