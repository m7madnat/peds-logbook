export const SERVICE_TYPES = ['Cardiac', 'Cath Lab', 'MRI', 'Non-cardiac', 'Other'] as const;

export const AGE_UNITS = ['months', 'years'] as const;

export const ASA_CLASSES = ['I', 'II', 'III', 'IV', 'V'] as const;

export const DIAGNOSES = [
  'TOF',
  'VSD',
  'ASD',
  'TGA',
  'HLHS',
  'Fontan physiology',
  'Other',
] as const;

// Existing procedures are kept as-is; the new fellowship-level procedures
// are appended so nothing already logged changes meaning.
export const PROCEDURES = [
  'Norwood',
  'Glenn',
  'Fontan',
  'TOF repair',
  'VSD repair',
  'Cath procedure',
  'Transplant',
  'Arterial Switch Operation (ASO)',
  'Ross Procedure',
  'Arch reconstruction',
  'Coarctation repair',
  'AV canal repair',
  'ASD/VSD repair',
  'Other',
] as const;

export const AIRWAY_TYPES = ['ETT', 'LMA', 'Mask', 'Other'] as const;

export const AIRWAY_DIFFICULTIES = ['Easy', 'Moderate', 'Difficult'] as const;

export const BLADE_TYPES = ['Miller', 'Mac', 'Other'] as const;

export const ARTERIAL_SITES = ['Radial', 'Femoral', 'Other'] as const;
export const CENTRAL_SITES = ['Internal jugular', 'Subclavian', 'Femoral', 'Other'] as const;
export const LINE_SIDES = ['Right', 'Left'] as const;

export const ROLES = ['Observer', 'Assisted', 'Primary', 'Supervised Independent'] as const;

export const LOCATIONS_DEFAULT = 'SickKids';

// --- Cardiac complexity -----------------------------------------------
export const PHYSIOLOGIES = ['Biventricular', 'Single ventricle'] as const;
export const PREVIOUS_CARDIAC_SURGERY = ['None', 'Previous repair', 'Previous palliation', 'Other'] as const;

// --- Anesthesia type -----------------------------------------------
export const ANESTHESIA_TYPES = [
  'General Anesthesia',
  'Regional Anesthesia',
  'General + Regional Anesthesia',
] as const;
export const REGIONAL_BLOCK_TYPES = [
  'Caudal',
  'Epidural',
  'Spinal',
  'TAP block',
  'Rectus sheath block',
  'Peripheral nerve block',
  'Other',
] as const;

// --- CPB / bypass -----------------------------------------------
export const SEPARATION_DIFFICULTIES = ['Easy', 'Moderate', 'Difficult'] as const;

export const VASOACTIVE_MEDS = [
  'Epinephrine',
  'Norepinephrine',
  'Milrinone',
  'Vasopressin',
  'Phenylephrine',
  'Calcium infusion',
] as const;

// --- Postoperative outcome -----------------------------------------------
export const DESTINATIONS = ['PICU', 'NICU', 'Cardiac ICU', 'Ward'] as const;
export const EXTUBATION_STATUSES = ['Extubated in OR', 'Remained intubated'] as const;
export const ECMO_STATUSES = ['No ECMO', 'VA ECMO', 'VV ECMO'] as const;
export const ECMO_TIMINGS = ['OR', 'ICU'] as const;

export const COMPLICATION_FLAGS = [
  'Low cardiac output syndrome',
  'Arrhythmia',
  'Bleeding concern',
  'Pulmonary hypertension crisis',
  'RV dysfunction',
  'Difficult ventilation',
  'Other',
] as const;

// Quick age-category presets for the fast Add Case form. Each maps to a
// representative (value, unit) pair stored in the existing age fields -
// no schema change. "Neonate" deliberately lands under 1 month so it also
// satisfies the dashboard's isNeonatal() check.
export const AGE_CATEGORIES = [
  { key: 'neonate', label: 'Neonate', hint: '<30 days', value: 0.5, unit: 'months' as const },
  { key: 'infant', label: 'Infant', hint: '1-12mo', value: 6, unit: 'months' as const },
  { key: 'child', label: 'Child', hint: '1-12y', value: 5, unit: 'years' as const },
  { key: 'adolescent', label: 'Adolescent', hint: '12-18y', value: 14, unit: 'years' as const },
] as const;

export function matchAgeCategory(
  value: number | null,
  unit: 'months' | 'years' | null
): string | null {
  const found = AGE_CATEGORIES.find((c) => c.value === value && c.unit === unit);
  return found ? found.key : null;
}

// Buckets used by the "age group" filter on the case list.
// Boundaries expressed in months for consistent comparison.
export function ageInMonths(value: number | null, unit: 'months' | 'years' | null): number | null {
  if (value == null || unit == null) return null;
  return unit === 'years' ? value * 12 : value;
}

export function ageGroupFor(months: number | null): 'infant' | 'toddler' | 'child' | 'adolescent' | null {
  if (months == null) return null;
  if (months < 12) return 'infant';
  if (months < 36) return 'toddler';
  if (months < 144) return 'child'; // up to 12 years
  return 'adolescent';
}

// Neonate = under ~30 days old. The data model only captures age in whole
// months or years (no days), so this is a frontend-only approximation:
// an age recorded in months that's under 1 is treated as neonatal.
// This does not require any schema or backend change.
export function isNeonatal(value: number | null, unit: 'months' | 'years' | null): boolean {
  if (value == null || unit == null) return false;
  return unit === 'months' && value < 1;
}
