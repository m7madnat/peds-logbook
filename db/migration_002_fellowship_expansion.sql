-- Migration 002: Fellowship-level case tracking expansion
-- Safe to run against an existing database - only ADDS columns with
-- sensible defaults. No existing data is modified or removed.
-- Run once: psql "<your DATABASE_URL>" -f db/migration_002_fellowship_expansion.sql

alter table cases
  -- Patient
  add column if not exists height_cm numeric,
  add column if not exists gestational_age_weeks numeric,

  -- Cardiac physiology / history
  add column if not exists cyanotic boolean,
  add column if not exists physiology text,
  add column if not exists previous_cardiac_surgery text,
  add column if not exists previous_cardiac_surgery_detail text,

  -- Diagnosis
  add column if not exists associated_lesions text,

  -- Anesthesia type
  add column if not exists anesthesia_type text not null default 'General Anesthesia',
  add column if not exists regional_block_type text,

  -- Airway
  add column if not exists intubation_attempts integer,
  add column if not exists video_laryngoscope_used boolean not null default false,
  add column if not exists fiberoptic_used boolean not null default false,

  -- Monitoring
  add column if not exists cerebral_nirs_used boolean not null default false,
  add column if not exists renal_nirs_used boolean not null default false,
  add column if not exists eeg_used boolean not null default false,

  -- Vascular access
  add column if not exists arterial_side text,
  add column if not exists central_side text,

  -- CPB
  add column if not exists cpb_duration_min numeric,
  add column if not exists dhca_used boolean not null default false,
  add column if not exists dhca_duration_min numeric,
  add column if not exists selective_cerebral_perfusion_used boolean not null default false,
  add column if not exists selective_cerebral_perfusion_duration_min numeric,
  add column if not exists lowest_temperature_c numeric,

  -- Intraoperative support
  add column if not exists vasoactive_meds text[] not null default '{}',

  -- Separation from CPB
  add column if not exists separation_difficulty text,
  add column if not exists separation_notes text,

  -- Postoperative outcome
  add column if not exists destination text,
  add column if not exists extubation_status text,
  add column if not exists ecmo_status text not null default 'No ECMO',
  add column if not exists ecmo_timing text,

  -- Complications
  add column if not exists complication_flags text[] not null default '{}',

  -- Fellowship learning
  add column if not exists anesthetic_challenges text,
  add column if not exists key_learning_points text,
  add column if not exists would_do_differently text;

create index if not exists idx_cases_physiology on cases (physiology);
create index if not exists idx_cases_ecmo_status on cases (ecmo_status);
