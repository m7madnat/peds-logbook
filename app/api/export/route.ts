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
  'height_cm',
  'gestational_age_weeks',
  'asa_class',
  'cyanotic',
  'physiology',
  'previous_cardiac_surgery',
  'previous_cardiac_surgery_detail',
  'diagnosis',
  'associated_lesions',
  'procedure',
  'role',
  'anesthesia_type',
  'regional_block_type',
  'airway_type',
  'airway_difficulty',
  'blade_type',
  'blade_size',
  'intubation_attempts',
  'video_laryngoscope_used',
  'fiberoptic_used',
  'tee_used',
  'cerebral_nirs_used',
  'renal_nirs_used',
  'eeg_used',
  'arterial_line',
  'arterial_site',
  'arterial_side',
  'central_line',
  'central_site',
  'central_side',
  'cpb_used',
  'cpb_duration_min',
  'cross_clamp_time_min',
  'dhca_used',
  'dhca_duration_min',
  'selective_cerebral_perfusion_used',
  'selective_cerebral_perfusion_duration_min',
  'lowest_temperature_c',
  'vasoactive_meds',
  'separation_difficulty',
  'separation_notes',
  'destination',
  'extubation_status',
  'ecmo_status',
  'ecmo_timing',
  'complications',
  'complication_flags',
  'learning_point',
  'anesthetic_challenges',
  'key_learning_points',
  'would_do_differently',
] as const;

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = Array.isArray(value) ? value.join('; ') : String(value);
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
  const cyanotic = rows.filter((r) => r.cyanotic).length;
  const singleVentricle = rows.filter((r) => r.physiology === 'Single ventricle').length;
  const ecmo = rows.filter((r) => r.ecmo_status && r.ecmo_status !== 'No ECMO').length;
  const dhca = rows.filter((r) => r.dhca_used).length;

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
  lines.push(`Cyanotic cases,${cyanotic}`);
  lines.push(`Single ventricle physiology,${singleVentricle}`);
  lines.push(`ECMO cases,${ecmo}`);
  lines.push(`DHCA cases,${dhca}`);

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
