'use client';

import { DIAGNOSES, PROCEDURES, AIRWAY_DIFFICULTIES, PHYSIOLOGIES } from '@/lib/constants';
import type { CaseFilters } from '@/lib/types';
import { cn } from '@/lib/utils';

const AGE_GROUPS = [
  { value: 'infant', label: 'Infant (<1y)' },
  { value: 'toddler', label: 'Toddler (1-3y)' },
  { value: 'child', label: 'Child (3-12y)' },
  { value: 'adolescent', label: 'Adolescent (12y+)' },
] as const;

export default function FilterGroups({
  filters,
  onChange,
}: {
  filters: CaseFilters;
  onChange: (f: CaseFilters) => void;
}) {
  function chip(key: keyof CaseFilters, value: string, label: string) {
    const active = filters[key] === value;
    return (
      <button
        key={value}
        type="button"
        onClick={() => onChange({ ...filters, [key]: active ? undefined : value })}
        className={cn(
          'rounded-lg border px-3 py-2 text-sm whitespace-nowrap transition-colors',
          active ? 'bg-mint text-ink border-mint font-medium' : 'bg-surface text-paper border-line hover:border-line2'
        )}
      >
        {label}
      </button>
    );
  }

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="field-label mb-2">Diagnosis</p>
        <div className="flex flex-wrap gap-1.5">{DIAGNOSES.map((d) => chip('diagnosis', d, d))}</div>
      </div>
      <div>
        <p className="field-label mb-2">Procedure</p>
        <div className="flex flex-wrap gap-1.5">{PROCEDURES.map((p) => chip('procedure', p, p))}</div>
      </div>
      <div>
        <p className="field-label mb-2">CPB</p>
        <div className="flex flex-wrap gap-1.5">
          {chip('cpb', 'yes', 'CPB used')}
          {chip('cpb', 'no', 'No CPB')}
        </div>
      </div>
      <div>
        <p className="field-label mb-2">Age Group</p>
        <div className="flex flex-wrap gap-1.5">{AGE_GROUPS.map((g) => chip('ageGroup', g.value, g.label))}</div>
      </div>
      <div>
        <p className="field-label mb-2">Airway Difficulty</p>
        <div className="flex flex-wrap gap-1.5">{AIRWAY_DIFFICULTIES.map((a) => chip('airwayDifficulty', a, a))}</div>
      </div>
      <div>
        <p className="field-label mb-2">Physiology</p>
        <div className="flex flex-wrap gap-1.5">{PHYSIOLOGIES.map((p) => chip('physiology', p, p))}</div>
      </div>
      <div>
        <p className="field-label mb-2">Cyanotic</p>
        <div className="flex flex-wrap gap-1.5">
          {chip('cyanotic', 'yes', 'Cyanotic')}
          {chip('cyanotic', 'no', 'Acyanotic')}
        </div>
      </div>
      <div>
        <p className="field-label mb-2">ECMO</p>
        <div className="flex flex-wrap gap-1.5">
          {chip('ecmo', 'yes', 'ECMO used')}
          {chip('ecmo', 'no', 'No ECMO')}
        </div>
      </div>
      {activeCount > 0 && (
        <button
          onClick={() => onChange({})}
          className="w-full rounded-xl border border-line py-2.5 text-sm text-muted hover:text-paper hover:border-line2 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
