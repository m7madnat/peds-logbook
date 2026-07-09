import { NextResponse } from 'next/server';
import { listCases } from '@/lib/db';

export const dynamic = 'force-dynamic';

const COLUMNS = [
  'case_number',
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

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET() {
  const rows = await listCases();
  const lines: string[] = [];

  lines.push(COLUMNS.join(','));
  for (const row of rows) {
    lines.push(COLUMNS.map((c) => csvEscape((row as unknown as Record<string, unknown>)[c])).join(','));
  }

  const total = rows.length;
  const cardiac = rows.filter((r) => r.service_type === 'Cardiac').length;
  const norwood = rows.filter((r) => r.procedure === 'Norwood').length;
  const glenn = rows.filter((r) => r.procedure === 'Glenn').length;
  const fontan = rows.filter((r) => r.procedure === 'Fontan').length;
  const tee = rows.filter((r) => r.tee_used).length;
  const aline = rows.filter((r) => r.arterial_line).length;
  const cline = rows.filter((r) => r.central_line).length;
  const cpb = rows.filter((r) => r.cpb_used).length;

  lines.push('');
  lines.push('SUMMARY');
  lines.push(`Total cases,${total}`);
  lines.push(`Cardiac cases,${cardiac}`);
  lines.push(`Norwood,${norwood}`);
  lines.push(`Glenn,${glenn}`);
  lines.push(`Fontan,${fontan}`);
  lines.push(`TEE used,${tee}`);
  lines.push(`Arterial lines,${aline}`);
  lines.push(`Central lines,${cline}`);
  lines.push(`CPB cases,${cpb}`);

  const csv = lines.join('\n');
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="peds-anesthesia-log-${date}.csv"`,
    },
  });
}
