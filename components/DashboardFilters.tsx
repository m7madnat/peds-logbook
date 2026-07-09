'use client';

import { DIAGNOSES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { DashboardFilterState } from '@/components/Dashboard';

const DATE_RANGES: { key: DashboardFilterState['dateRange']; label: string }[] = [
  { key: '30d', label: 'Last 30 days' },
  { key: '6mo', label: 'Last 6 months' },
  { key: 'all', label: 'All time' },
];

export default function DashboardFilters({
  filters,
  onChange,
  activeCount,
  onClear,
}: {
  filters: DashboardFilterState;
  onChange: (f: DashboardFilterState) => void;
  activeCount: number;
  onClear: () => void;
}) {
  return (
    <div className="rounded-xl2 border border-line bg-raised p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-up">
      <div className="flex-1 min-w-0">
        <p className="field-label mb-1.5">Date range</p>
        <div className="grid grid-cols-3 gap-1.5">
          {DATE_RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onChange({ ...filters, dateRange: r.key })}
              className={cn(
                'rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                filters.dateRange === r.key
                  ? 'bg-mint text-ink border-mint'
                  : 'bg-surface text-paper border-line hover:border-line2'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <label htmlFor="dashboard-diagnosis-filter" className="field-label mb-1.5 block">
          Diagnosis
        </label>
        <div className="relative">
          <select
            id="dashboard-diagnosis-filter"
            value={filters.diagnosis}
            onChange={(e) => onChange({ ...filters, diagnosis: e.target.value })}
            className="w-full appearance-none rounded-lg bg-surface border border-line px-3 py-2 pr-8 text-sm text-paper focus:border-mint outline-none cursor-pointer"
          >
            <option value="all">All diagnoses</option>
            {DIAGNOSES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="#8CA0B3" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="field-label mb-1.5">CPB</p>
        <div className="grid grid-cols-3 gap-1.5">
          {(['all', 'yes', 'no'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ ...filters, cpb: v })}
              className={cn(
                'rounded-lg border px-2 py-2 text-xs font-medium capitalize transition-colors',
                filters.cpb === v
                  ? 'bg-mint text-ink border-mint'
                  : 'bg-surface text-paper border-line hover:border-line2'
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-lg border border-line2 px-3 py-2 text-xs font-medium text-muted hover:text-paper hover:border-mint/50 transition-colors self-start sm:self-end"
        >
          Clear ({activeCount})
        </button>
      )}
    </div>
  );
}
