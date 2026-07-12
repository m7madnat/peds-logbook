import {
  SERVICE_TYPES,
  AGE_UNITS,
  ASA_CLASSES,
  AIRWAY_TYPES,
  AIRWAY_DIFFICULTIES,
  BLADE_TYPES,
  ARTERIAL_SITES,
  CENTRAL_SITES,
  LINE_SIDES,
  ROLES,
  PHYSIOLOGIES,
  PREVIOUS_CARDIAC_SURGERY,
  ANESTHESIA_TYPES,
  REGIONAL_BLOCK_TYPES,
  SEPARATION_DIFFICULTIES,
  VASOACTIVE_MEDS,
  DESTINATIONS,
  EXTUBATION_STATUSES,
  ECMO_STATUSES,
  ECMO_TIMINGS,
  COMPLICATION_FLAGS,
} from '@/lib/constants';
import type { CaseInput } from '@/lib/types';

type Check = readonly string[];

// A field is only checked if the input actually includes it (partial
// updates from the edit form only send changed fields). Legacy values
// ('Grade 2', 'IJ') are accepted so old records remain editable even
// though they're no longer offered as fresh choices.
const ENUM_FIELDS: Record<string, Check> = {
  service_type: SERVICE_TYPES,
  patient_age_unit: AGE_UNITS,
  asa_class: ASA_CLASSES,
  airway_type: AIRWAY_TYPES,
  airway_difficulty: [...AIRWAY_DIFFICULTIES, 'Grade 2'],
  blade_type: BLADE_TYPES,
  arterial_site: ARTERIAL_SITES,
  arterial_side: LINE_SIDES,
  central_site: [...CENTRAL_SITES, 'IJ'],
  central_side: LINE_SIDES,
  role: ROLES,
  physiology: PHYSIOLOGIES,
  previous_cardiac_surgery: PREVIOUS_CARDIAC_SURGERY,
  anesthesia_type: ANESTHESIA_TYPES,
  regional_block_type: REGIONAL_BLOCK_TYPES,
  separation_difficulty: SEPARATION_DIFFICULTIES,
  destination: DESTINATIONS,
  extubation_status: EXTUBATION_STATUSES,
  ecmo_status: ECMO_STATUSES,
  ecmo_timing: ECMO_TIMINGS,
};

const ARRAY_ENUM_FIELDS: Record<string, Check> = {
  vasoactive_meds: VASOACTIVE_MEDS,
  complication_flags: COMPLICATION_FLAGS,
};

// Fields that must be a non-negative number when provided.
const NONNEGATIVE_NUMERIC_FIELDS = [
  'patient_age_value',
  'weight_kg',
  'height_cm',
  'gestational_age_weeks',
  'intubation_attempts',
  'cpb_duration_min',
  'cross_clamp_time_min',
  'dhca_duration_min',
  'selective_cerebral_perfusion_duration_min',
] as const;

export function validateCaseInput(input: Partial<CaseInput>): string | null {
  const body = input as Record<string, unknown>;

  if ('date' in body && !body.date) {
    return 'Date is required.';
  }

  for (const [field, allowed] of Object.entries(ENUM_FIELDS)) {
    if (field in body && body[field] != null && !allowed.includes(body[field] as string)) {
      return `"${body[field]}" is not a valid value for ${field.replace(/_/g, ' ')}.`;
    }
  }

  for (const [field, allowed] of Object.entries(ARRAY_ENUM_FIELDS)) {
    if (field in body && body[field] != null) {
      const val = body[field];
      if (!Array.isArray(val)) return `${field.replace(/_/g, ' ')} must be a list.`;
      for (const v of val) {
        if (!allowed.includes(v)) return `"${v}" is not a valid ${field.replace(/_/g, ' ')} entry.`;
      }
    }
  }

  for (const field of NONNEGATIVE_NUMERIC_FIELDS) {
    if (field in body && body[field] != null) {
      const val = body[field];
      if (typeof val !== 'number' || Number.isNaN(val) || val < 0) {
        return `${field.replace(/_/g, ' ')} must be a positive number.`;
      }
    }
  }

  // Cross-field: regional block type only makes sense alongside a
  // regional-including anesthesia type.
  if (
    body.regional_block_type &&
    body.anesthesia_type &&
    body.anesthesia_type === 'General Anesthesia'
  ) {
    return 'Regional block type requires an anesthesia type that includes Regional Anesthesia.';
  }

  // Cross-field: ECMO timing only makes sense alongside an active ECMO status.
  if (body.ecmo_timing && body.ecmo_status === 'No ECMO') {
    return 'ECMO timing requires an ECMO status other than "No ECMO".';
  }

  if (typeof body.learning_point === 'string' && body.learning_point.length > 300) {
    return 'Learning point must be 300 characters or fewer.';
  }

  return null; // valid
}
