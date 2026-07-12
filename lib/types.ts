export type ServiceType = 'Cardiac' | 'Cath Lab' | 'MRI' | 'Non-cardiac' | 'Other';
export type AgeUnit = 'months' | 'years';
export type AsaClass = 'I' | 'II' | 'III' | 'IV' | 'V';
export type AirwayType = 'ETT' | 'LMA' | 'Mask' | 'Other';
export type AirwayDifficulty = 'Easy' | 'Moderate' | 'Difficult' | 'Grade 2'; // 'Grade 2' kept for legacy records
export type BladeType = 'Miller' | 'Mac' | 'Other';
export type ArterialSite = 'Radial' | 'Femoral' | 'Other';
export type CentralSite = 'Internal jugular' | 'Femoral' | 'Subclavian' | 'Other' | 'IJ'; // 'IJ' kept for legacy records
export type LineSide = 'Right' | 'Left';
export type CaseRole = 'Observer' | 'Assisted' | 'Primary' | 'Supervised Independent';

export type Physiology = 'Biventricular' | 'Single ventricle';
export type PreviousCardiacSurgery = 'None' | 'Previous repair' | 'Previous palliation' | 'Other';

export type AnesthesiaType = 'General Anesthesia' | 'Regional Anesthesia' | 'General + Regional Anesthesia';
export type RegionalBlockType =
  | 'Caudal'
  | 'Epidural'
  | 'Spinal'
  | 'TAP block'
  | 'Rectus sheath block'
  | 'Peripheral nerve block'
  | 'Other';

export type SeparationDifficulty = 'Easy' | 'Moderate' | 'Difficult';
export type VasoactiveMed =
  | 'Epinephrine'
  | 'Norepinephrine'
  | 'Milrinone'
  | 'Vasopressin'
  | 'Phenylephrine'
  | 'Calcium infusion';

export type Destination = 'PICU' | 'NICU' | 'Cardiac ICU' | 'Ward';
export type ExtubationStatus = 'Extubated in OR' | 'Remained intubated';
export type EcmoStatus = 'No ECMO' | 'VA ECMO' | 'VV ECMO';
export type EcmoTiming = 'OR' | 'ICU';
export type ComplicationFlag =
  | 'Low cardiac output syndrome'
  | 'Arrhythmia'
  | 'Bleeding concern'
  | 'Pulmonary hypertension crisis'
  | 'RV dysfunction'
  | 'Difficult ventilation'
  | 'Other';

export interface AnesthesiaCase {
  id: string;
  case_number: number;
  date: string; // ISO date
  location: string;
  service_type: ServiceType;

  // Patient
  patient_age_value: number | null;
  patient_age_unit: AgeUnit | null;
  weight_kg: number | null;
  height_cm: number | null;
  gestational_age_weeks: number | null;
  asa_class: AsaClass | null;

  // Cardiac physiology / history
  cyanotic: boolean | null;
  physiology: Physiology | null;
  previous_cardiac_surgery: PreviousCardiacSurgery | null;
  previous_cardiac_surgery_detail: string | null;

  // Diagnosis
  diagnosis: string | null; // primary diagnosis
  associated_lesions: string | null;

  // Procedure / role
  procedure: string | null;
  role: CaseRole;

  // Anesthesia type
  anesthesia_type: AnesthesiaType;
  regional_block_type: RegionalBlockType | null;

  // Airway
  airway_type: AirwayType | null;
  airway_difficulty: AirwayDifficulty | null;
  blade_type: BladeType | null;
  blade_size: string | null;
  intubation_attempts: number | null;
  video_laryngoscope_used: boolean;
  fiberoptic_used: boolean;

  // Monitoring
  tee_used: boolean;
  cerebral_nirs_used: boolean;
  renal_nirs_used: boolean;
  eeg_used: boolean;

  // Vascular access
  arterial_line: boolean;
  arterial_site: ArterialSite | null;
  arterial_side: LineSide | null;
  central_line: boolean;
  central_site: CentralSite | null;
  central_side: LineSide | null;

  // CPB
  cpb_used: boolean;
  cpb_duration_min: number | null;
  cross_clamp_time_min: number | null; // aortic cross-clamp duration
  dhca_used: boolean;
  dhca_duration_min: number | null;
  selective_cerebral_perfusion_used: boolean;
  selective_cerebral_perfusion_duration_min: number | null;
  lowest_temperature_c: number | null;

  // Intraoperative support
  vasoactive_meds: VasoactiveMed[];

  // Separation from CPB
  separation_difficulty: SeparationDifficulty | null;
  separation_notes: string | null;

  // Postoperative outcome
  destination: Destination | null;
  extubation_status: ExtubationStatus | null;
  ecmo_status: EcmoStatus;
  ecmo_timing: EcmoTiming | null;

  // Complications
  complications: string | null; // free-text notes (legacy + supplementary)
  complication_flags: ComplicationFlag[];

  // Fellowship learning
  learning_point: string | null; // legacy single field, kept for old records
  anesthetic_challenges: string | null;
  key_learning_points: string | null;
  would_do_differently: string | null;

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
  physiology?: Physiology;
  cyanotic?: 'yes' | 'no';
  ecmo?: 'yes' | 'no';
}
