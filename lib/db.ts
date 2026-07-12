import { Pool, types } from 'pg';
import { randomUUID } from 'crypto';
import { ageGroupFor, ageInMonths } from '@/lib/constants';
import type { AnesthesiaCase, CaseFilters, CaseInput } from '@/lib/types';

// node-pg returns NUMERIC columns as strings by default (to avoid silent
// precision loss). This app only stores small decimal values (ages,
// weights, cross-clamp minutes) and does real arithmetic/comparisons on
// them (e.g. the neonatal "<1 month" check), so parse them as numbers.
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));
// DATE columns: keep the raw 'YYYY-MM-DD' text instead of node-pg's default
// JS Date conversion, which serializes to a full ISO timestamp and breaks
// both the table display and the "YYYY-MM" month-grouping used on the
// dashboard trend chart.
types.setTypeParser(1082, (val) => val);

// A real Postgres database - required once the app leaves your own computer,
// since hosts like Render don't keep local files around between requests.
// Run db/schema.sql once against your database before starting the app.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[db] DATABASE_URL is not set. Set it in .env.local (see .env.local.example).');
}

// Hosted providers (Render, Supabase, etc.) require SSL with a self-signed
// cert chain; a local/dev Postgres on your own machine does not.
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString ?? '');

const pool = new Pool({
  connectionString,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
});

const FORBIDDEN_FIELDS = ['name', 'first_name', 'last_name', 'mrn', 'dob', 'patient_name'];

const COLUMNS = [
  'date',
  'location',
  'service_type',
  // Patient
  'patient_age_value',
  'patient_age_unit',
  'weight_kg',
  'height_cm',
  'gestational_age_weeks',
  'asa_class',
  // Cardiac physiology / history
  'cyanotic',
  'physiology',
  'previous_cardiac_surgery',
  'previous_cardiac_surgery_detail',
  // Diagnosis
  'diagnosis',
  'associated_lesions',
  // Procedure / role
  'procedure',
  'role',
  // Anesthesia type
  'anesthesia_type',
  'regional_block_type',
  // Airway
  'airway_type',
  'airway_difficulty',
  'blade_type',
  'blade_size',
  'intubation_attempts',
  'video_laryngoscope_used',
  'fiberoptic_used',
  // Monitoring
  'tee_used',
  'cerebral_nirs_used',
  'renal_nirs_used',
  'eeg_used',
  // Vascular access
  'arterial_line',
  'arterial_site',
  'arterial_side',
  'central_line',
  'central_site',
  'central_side',
  // CPB
  'cpb_used',
  'cpb_duration_min',
  'cross_clamp_time_min',
  'dhca_used',
  'dhca_duration_min',
  'selective_cerebral_perfusion_used',
  'selective_cerebral_perfusion_duration_min',
  'lowest_temperature_c',
  // Intraoperative support
  'vasoactive_meds',
  // Separation from CPB
  'separation_difficulty',
  'separation_notes',
  // Postoperative outcome
  'destination',
  'extubation_status',
  'ecmo_status',
  'ecmo_timing',
  // Complications
  'complications',
  'complication_flags',
  // Fellowship learning
  'learning_point',
  'anesthetic_challenges',
  'key_learning_points',
  'would_do_differently',
] as const;

// Columns typed text[] in Postgres: default to an empty array rather than
// null, since the column is NOT NULL with a '{}' default.
const ARRAY_COLUMNS = new Set(['vasoactive_meds', 'complication_flags']);

function defaultFor(column: string): unknown {
  return ARRAY_COLUMNS.has(column) ? [] : null;
}

function assertNoIdentifiers(input: Record<string, unknown>): void {
  for (const key of FORBIDDEN_FIELDS) {
    if (key in input) {
      throw new Error(`Field "${key}" is not permitted in a de-identified logbook.`);
    }
  }
}

export async function listCases(filters: CaseFilters = {}): Promise<AnesthesiaCase[]> {
  const { rows } = await pool.query<AnesthesiaCase>(
    'select * from cases order by date desc, case_number desc'
  );
  let result = rows;

  if (filters.diagnosis) result = result.filter((r) => r.diagnosis === filters.diagnosis);
  if (filters.procedure) result = result.filter((r) => r.procedure === filters.procedure);
  if (filters.cpb === 'yes') result = result.filter((r) => r.cpb_used);
  if (filters.cpb === 'no') result = result.filter((r) => !r.cpb_used);
  if (filters.airwayDifficulty)
    result = result.filter((r) => r.airway_difficulty === filters.airwayDifficulty);
  if (filters.physiology) result = result.filter((r) => r.physiology === filters.physiology);
  if (filters.cyanotic === 'yes') result = result.filter((r) => r.cyanotic === true);
  if (filters.cyanotic === 'no') result = result.filter((r) => r.cyanotic === false);
  if (filters.ecmo === 'yes') result = result.filter((r) => r.ecmo_status !== 'No ECMO');
  if (filters.ecmo === 'no') result = result.filter((r) => r.ecmo_status === 'No ECMO' || !r.ecmo_status);
  if (filters.ageGroup) {
    result = result.filter(
      (r) => ageGroupFor(ageInMonths(r.patient_age_value, r.patient_age_unit)) === filters.ageGroup
    );
  }
  if (filters.q) {
    const needle = filters.q.toLowerCase();
    result = result.filter((r) =>
      [
        r.diagnosis,
        r.procedure,
        r.associated_lesions,
        r.complications,
        r.learning_point,
        r.anesthetic_challenges,
        r.key_learning_points,
        r.would_do_differently,
        r.separation_notes,
      ]
        .filter(Boolean)
        .some((f) => (f as string).toLowerCase().includes(needle))
    );
  }

  return result;
}

export async function getCase(id: string): Promise<AnesthesiaCase | null> {
  const { rows } = await pool.query<AnesthesiaCase>('select * from cases where id = $1', [id]);
  return rows[0] ?? null;
}

export async function createCase(input: CaseInput): Promise<AnesthesiaCase> {
  assertNoIdentifiers(input as unknown as Record<string, unknown>);

  const id = randomUUID();
  const values = COLUMNS.map((c) => (input as Record<string, unknown>)[c] ?? defaultFor(c));
  const placeholders = COLUMNS.map((_, i) => `$${i + 2}`).join(', ');

  const { rows } = await pool.query<AnesthesiaCase>(
    `insert into cases (id, ${COLUMNS.join(', ')})
     values ($1, ${placeholders})
     returning *`,
    [id, ...values]
  );
  return rows[0];
}

export async function updateCase(id: string, input: Partial<CaseInput>): Promise<AnesthesiaCase | null> {
  assertNoIdentifiers(input as unknown as Record<string, unknown>);

  const keys = Object.keys(input).filter((k) => (COLUMNS as readonly string[]).includes(k));
  if (keys.length === 0) return getCase(id);

  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = keys.map((k) => (input as Record<string, unknown>)[k]);

  const { rows } = await pool.query<AnesthesiaCase>(
    `update cases set ${setClause}, updated_at = now() where id = $1 returning *`,
    [id, ...values]
  );
  return rows[0] ?? null;
}

export async function deleteCase(id: string): Promise<void> {
  await pool.query('delete from cases where id = $1', [id]);
}
