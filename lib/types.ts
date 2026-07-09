export type ServiceType = 'Cardiac' | 'Cath Lab' | 'MRI' | 'Non-cardiac' | 'Other';
export type AgeUnit = 'months' | 'years';
export type AsaClass = 'I' | 'II' | 'III' | 'IV' | 'V';
export type AirwayType = 'ETT' | 'LMA' | 'Mask' | 'Other';
export type AirwayDifficulty = 'Easy' | 'Grade 2' | 'Difficult';
export type BladeType = 'Miller' | 'Mac' | 'Other';
export type ArterialSite = 'Radial' | 'Femoral' | 'Other';
export type CentralSite = 'IJ' | 'Femoral' | 'Subclavian' | 'Other';
export type CaseRole = 'Observer' | 'Assisted' | 'Primary' | 'Supervised Independent';

export interface AnesthesiaCase {
  id: string;
  case_number: number;
  date: string; // ISO date
  location: string;
  service_type: ServiceType;
  patient_age_value: number | null;
  patient_age_unit: AgeUnit | null;
  weight_kg: number | null;
  asa_class: AsaClass | null;
  diagnosis: string | null;
  procedure: string | null;
  airway_type: AirwayType | null;
  airway_difficulty: AirwayDifficulty | null;
  blade_type: BladeType | null;
  blade_size: string | null;
  arterial_line: boolean;
  arterial_site: ArterialSite | null;
  central_line: boolean;
  central_site: CentralSite | null;
  tee_used: boolean;
  cpb_used: boolean;
  cross_clamp_time_min: number | null;
  role: CaseRole;
  complications: string | null;
  learning_point: string | null;
  created_at: string;
  updated_at: string;
}

// Shape accepted from the client when creating/editing a case.
export type CaseInput = Omit<
  AnesthesiaCase,
  'id' | 'case_number' | 'created_at' | 'updated_at'
>;

export interface CaseFilters {
  q?: string;
  diagnosis?: string;
  procedure?: string;
  cpb?: 'yes' | 'no';
  ageGroup?: 'infant' | 'toddler' | 'child' | 'adolescent';
  airwayDifficulty?: AirwayDifficulty;
}
