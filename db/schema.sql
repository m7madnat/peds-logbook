-- Pediatric Cardiac Anesthesia Logbook — Postgres schema
-- Single-user, de-identified educational logbook. No PHI/identifiers.
-- Run this once against a brand-new database (Render's free Postgres, or
-- any Postgres 13+) before starting the app.
--
-- If you already have a database from before the fellowship-level
-- expansion, do NOT run this file against it - run
-- db/migration_002_fellowship_expansion.sql instead, which adds the new
-- columns without touching your existing cases.

create table if not exists cases (
  case_number serial primary key,
  id text unique not null,

  date date not null default current_date,
  location text not null default 'SickKids',
  service_type text not null default 'Cardiac',

  -- Patient
  patient_age_value numeric,
  patient_age_unit text default 'years',
  weight_kg numeric,
  height_cm numeric,
  gestational_age_weeks numeric,
  asa_class text,

  -- Cardiac physiology / history
  cyanotic boolean,
  physiology text,
  previous_cardiac_surgery text,
  previous_cardiac_surgery_detail text,

  -- Diagnosis
  diagnosis text,
  associated_lesions text,

  -- Procedure / role
  procedure text,
  role text not null default 'Assisted',

  -- Anesthesia type
  anesthesia_type text not null default 'General Anesthesia',
  regional_block_type text,

  -- Airway
  airway_type text,
  airway_difficulty text,
  blade_type text,
  blade_size text,
  intubation_attempts integer,
  video_laryngoscope_used boolean not null default false,
  fiberoptic_used boolean not null default false,

  -- Monitoring
  tee_used boolean not null default false,
  cerebral_nirs_used boolean not null default false,
  renal_nirs_used boolean not null default false,
  eeg_used boolean not null default false,

  -- Vascular access
  arterial_line boolean not null default false,
  arterial_site text,
  arterial_side text,
  central_line boolean not null default false,
  central_site text,
  central_side text,

  -- CPB
  cpb_used boolean not null default false,
  cpb_duration_min numeric,
  cross_clamp_time_min numeric,
  dhca_used boolean not null default false,
  dhca_duration_min numeric,
  selective_cerebral_perfusion_used boolean not null default false,
  selective_cerebral_perfusion_duration_min numeric,
  lowest_temperature_c numeric,

  -- Intraoperative support
  vasoactive_meds text[] not null default '{}',

  -- Separation from CPB
  separation_difficulty text,
  separation_notes text,

  -- Postoperative outcome
  destination text,
  extubation_status text,
  ecmo_status text not null default 'No ECMO',
  ecmo_timing text,

  -- Complications
  complications text,
  complication_flags text[] not null default '{}',

  -- Fellowship learning
  learning_point text,
  anesthetic_challenges text,
  key_learning_points text,
  would_do_differently text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table cases is
  'De-identified educational anesthesia case log. Do NOT add name, MRN, DOB, or any patient identifier columns.';

create index if not exists idx_cases_date on cases (date desc);
create index if not exists idx_cases_diagnosis on cases (diagnosis);
create index if not exists idx_cases_procedure on cases (procedure);
create index if not exists idx_cases_cpb on cases (cpb_used);
create index if not exists idx_cases_airway_difficulty on cases (airway_difficulty);
create index if not exists idx_cases_physiology on cases (physiology);
create index if not exists idx_cases_ecmo_status on cases (ecmo_status);
