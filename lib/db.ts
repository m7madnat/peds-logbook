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
  'patient_age_value',
  'patient_age_unit',
  'weight_kg',
  'asa_class',
  'diagnosis',
  'procedure',
  'airway_type',
  'airway_difficulty',
  'blade_type',
  'blade_size',
  'arterial_line',
  'arterial_site',
  'central_line',
  'central_site',
  'tee_used',
  'cpb_used',
  'cross_clamp_time_min',
  'role',
  'complications',
  'learning_point',
] as const;

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
  if (filters.ageGroup) {
    result = result.filter(
      (r) => ageGroupFor(ageInMonths(r.patient_age_value, r.patient_age_unit)) === filters.ageGroup
    );
  }
  if (filters.q) {
    const needle = filters.q.toLowerCase();
    result = result.filter((r) =>
      [r.diagnosis, r.procedure, r.complications, r.learning_point]
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
  const values = COLUMNS.map((c) => (input as Record<string, unknown>)[c] ?? null);
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
