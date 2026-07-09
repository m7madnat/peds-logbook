-- Pediatric Cardiac Anesthesia Logbook — Postgres schema
-- Single-user, de-identified educational logbook. No PHI/identifiers.
-- Run this once against your database (Render's free Postgres, or any
-- Postgres 13+) before starting the app.

create table if not exists cases (
  case_number serial primary key,
  id text unique not null,

  date date not null default current_date,
  location text not null default 'SickKids',
  service_type text not null default 'Cardiac',

  patient_age_value numeric,
  patient_age_unit text default 'years',
  weight_kg numeric,

  asa_class text,
  diagnosis text,
  procedure text,

  airway_type text,
  airway_difficulty text,
  blade_type text,
  blade_size text,

  arterial_line boolean not null default false,
  arterial_site text,

  central_line boolean not null default false,
  central_site text,

  tee_used boolean not null default false,
  cpb_used boolean not null default false,
  cross_clamp_time_min numeric,

  role text not null default 'Assisted',
  complications text,
  learning_point text,

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
