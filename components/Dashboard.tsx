'use client';

import { memo, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, Skeleton } from '@/components/ui';
import DashboardFilters from '@/components/DashboardFilters';
import { DIAGNOSES, PROCEDURES, AIRWAY_DIFFICULTIES, ROLES, COMPLICATION_FLAGS, VASOACTIVE_MEDS, isNeonatal } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { AnesthesiaCase } from '@/lib/types';

// The recharts-heavy grid is lazy-loaded and never server-rendered, so the
// KPI header (the part people check first) paints immediately.
const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-4">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  ),
});

export interface DashboardFilterState {
  dateRange: '30d' | '6mo' | 'all';
  diagnosis: string; // 'all' or a DIAGNOSES value
  cpb: 'all' | 'yes' | 'no';
  service: 'Cardiac' | null;
  tee: boolean;
  arterial: boolean;
  central: boolean;
  neonatal: boolean;
  ecmo: boolean;
  singleVentricle: boolean;
  cyanotic: boolean;
}

const DEFAULT_FILTERS: DashboardFilterState = {
  dateRange: 'all',
  diagnosis: 'all',
  cpb: 'all',
  service: null,
  tee: false,
  arterial: false,
  central: false,
  neonatal: false,
  ecmo: false,
  singleVentricle: false,
  cyanotic: false,
};

function withinDateRange(dateStr: string, range: DashboardFilterState['dateRange']): boolean {
  if (range === 'all') return true;
  const date = new Date(dateStr);
  const now = new Date();
  const cutoff = new Date(now);
  if (range === '30d') cutoff.setDate(now.getDate() - 30);
  if (range === '6mo') cutoff.setMonth(now.getMonth() - 6);
  return date >= cutoff;
}

function applyFilters(cases: AnesthesiaCase[], f: DashboardFilterState): AnesthesiaCase[] {
  return cases.filter((c) => {
    if (!withinDateRange(c.date, f.dateRange)) return false;
    if (f.diagnosis !== 'all' && c.diagnosis !== f.diagnosis) return false;
    if (f.cpb === 'yes' && !c.cpb_used) return false;
    if (f.cpb === 'no' && c.cpb_used) return false;
    if (f.service && c.service_type !== f.service) return false;
    if (f.tee && !c.tee_used) return false;
    if (f.arterial && !c.arterial_line) return false;
    if (f.central && !c.central_line) return false;
    if (f.neonatal && !isNeonatal(c.patient_age_value, c.patient_age_unit)) return false;
    if (f.ecmo && (!c.ecmo_status || c.ecmo_status === 'No ECMO')) return false;
    if (f.singleVentricle && c.physiology !== 'Single ventricle') return false;
    if (f.cyanotic && !c.cyanotic) return false;
    return true;
  });
}

function monthlyTrend(cases: AnesthesiaCase[]) {
  const buckets = new Map<string, number>();
  for (const c of cases) {
    const key = c.date?.slice(0, 7);
    if (!key) continue;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, count]) => ({ month: month.slice(2), count }));
}

function distribution(cases: AnesthesiaCase[], key: keyof AnesthesiaCase, categories: readonly string[]) {
  const counts = new Map<string, number>();
  for (const cat of categories) counts.set(cat, 0);
  let other = 0;
  for (const c of cases) {
    const v = c[key] as unknown as string | null;
    if (v == null) continue;
    if (counts.has(v)) counts.set(v, (counts.get(v) ?? 0) + 1);
    else other += 1;
  }
  const rows = categories.map((cat) => ({ name: cat, count: counts.get(cat) ?? 0 }));
  if (other > 0) rows.push({ name: 'Other', count: other });
  return rows;
}

// For array-valued columns (a case can have multiple complications, or
// multiple vasoactive meds) - counts how many cases include each option,
// not how many times it appears (a case is only counted once per flag).
function arrayDistribution(cases: AnesthesiaCase[], key: 'complication_flags' | 'vasoactive_meds', categories: readonly string[]) {
  const counts = new Map<string, number>();
  for (const cat of categories) counts.set(cat, 0);
  for (const c of cases) {
    const values = (c[key] as string[] | null) ?? [];
    for (const v of values) {
      if (counts.has(v)) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }
  return categories.map((cat) => ({ name: cat, count: counts.get(cat) ?? 0 })).filter((r) => r.count > 0);
}

const KpiCard = memo(function KpiCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'text-left rounded-xl2 border p-4 transition-all duration-150 hover:border-line2 hover:shadow-raised active:scale-[0.98] animate-fade-up',
        active ? 'bg-mint/10 border-mint shadow-card' : 'bg-raised border-line'
      )}
    >
      <p className={cn('field-label', active && 'text-mint')}>{label}</p>
      <p className={cn('text-3xl font-semibold tabular-nums mt-1.5', active ? 'text-mint' : 'text-paper')}>
        {value}
      </p>
    </button>
  );
});

function Dashboard({ cases }: { cases: AnesthesiaCase[] }) {
  const [filters, setFilters] = useState<DashboardFilterState>(DEFAULT_FILTERS);

  const filtered = useMemo(() => applyFilters(cases, filters), [cases, filters]);

  const activeCount = useMemo(
    () =>
      [
        filters.dateRange !== 'all',
        filters.diagnosis !== 'all',
        filters.cpb !== 'all',
        filters.service !== null,
        filters.tee,
        filters.arterial,
        filters.central,
        filters.neonatal,
        filters.ecmo,
        filters.singleVentricle,
        filters.cyanotic,
      ].filter(Boolean).length,
    [filters]
  );

  function toggleService() {
    setFilters((f) => ({ ...f, service: f.service === 'Cardiac' ? null : 'Cardiac' }));
  }
  function toggleCpb() {
    setFilters((f) => ({ ...f, cpb: f.cpb === 'yes' ? 'all' : 'yes' }));
  }
  function toggleNeonatal() {
    setFilters((f) => ({ ...f, neonatal: !f.neonatal }));
  }
  function toggleTee() {
    setFilters((f) => ({ ...f, tee: !f.tee }));
  }
  function toggleArterial() {
    setFilters((f) => ({ ...f, arterial: !f.arterial }));
  }
  function toggleCentral() {
    setFilters((f) => ({ ...f, central: !f.central }));
  }
  function toggleEcmo() {
    setFilters((f) => ({ ...f, ecmo: !f.ecmo }));
  }
  function toggleSingleVentricle() {
    setFilters((f) => ({ ...f, singleVentricle: !f.singleVentricle }));
  }
  function toggleCyanotic() {
    setFilters((f) => ({ ...f, cyanotic: !f.cyanotic }));
  }

  const stats = useMemo(() => {
    const total = filtered.length;
    const cardiac = filtered.filter((c) => c.service_type === 'Cardiac').length;
    const cpb = filtered.filter((c) => c.cpb_used).length;
    const neonatal = filtered.filter((c) => isNeonatal(c.patient_age_value, c.patient_age_unit)).length;
    const tee = filtered.filter((c) => c.tee_used).length;
    const aline = filtered.filter((c) => c.arterial_line).length;
    const cline = filtered.filter((c) => c.central_line).length;
    const ecmo = filtered.filter((c) => c.ecmo_status && c.ecmo_status !== 'No ECMO').length;
    const cyanotic = filtered.filter((c) => c.cyanotic).length;
    const singleVentricle = filtered.filter((c) => c.physiology === 'Single ventricle').length;
    const dhca = filtered.filter((c) => c.dhca_used).length;
    return { total, cardiac, cpb, neonatal, tee, aline, cline, ecmo, cyanotic, singleVentricle, dhca };
  }, [filtered]);

  const chartData = useMemo(
    () => ({
      trend: monthlyTrend(filtered),
      diagnosisDist: distribution(filtered, 'diagnosis', DIAGNOSES),
      procedureDist: distribution(filtered, 'procedure', PROCEDURES),
      airwayDist: distribution(filtered, 'airway_difficulty', AIRWAY_DIFFICULTIES),
      roleDist: distribution(filtered, 'role', ROLES),
      complicationDist: arrayDistribution(filtered, 'complication_flags', COMPLICATION_FLAGS),
      vasoactiveDist: arrayDistribution(filtered, 'vasoactive_meds', VASOACTIVE_MEDS),
    }),
    [filtered]
  );

  return (
    <div className="mx-auto max-w-6xl w-full px-4 pt-5 pb-8 space-y-6">
      <DashboardFilters
        filters={filters}
        onChange={setFilters}
        activeCount={activeCount}
        onClear={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* KPI header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total Cases"
          value={stats.total}
          active={activeCount === 0}
          onClick={() => setFilters(DEFAULT_FILTERS)}
        />
        <KpiCard label="Cardiac Cases" value={stats.cardiac} active={filters.service === 'Cardiac'} onClick={toggleService} />
        <KpiCard label="CPB Cases" value={stats.cpb} active={filters.cpb === 'yes'} onClick={toggleCpb} />
        <KpiCard label="Neonates (<30d)" value={stats.neonatal} active={filters.neonatal} onClick={toggleNeonatal} />
        <KpiCard label="TEEs Performed" value={stats.tee} active={filters.tee} onClick={toggleTee} />
        <KpiCard label="Arterial Lines" value={stats.aline} active={filters.arterial} onClick={toggleArterial} />
        <KpiCard label="Central Lines" value={stats.cline} active={filters.central} onClick={toggleCentral} />
        <KpiCard label="ECMO Cases" value={stats.ecmo} active={filters.ecmo} onClick={toggleEcmo} />
        <KpiCard label="Single Ventricle" value={stats.singleVentricle} active={filters.singleVentricle} onClick={toggleSingleVentricle} />
        <KpiCard label="Cyanotic Cases" value={stats.cyanotic} active={filters.cyanotic} onClick={toggleCyanotic} />
        <KpiCard label="DHCA Cases" value={stats.dhca} />
      </div>

      {stats.total === 0 ? (
        <Card>
          <CardContent className="py-14 text-center animate-fade-in">
            <p className="text-muted">No cases match the current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <DashboardCharts
          trend={chartData.trend}
          diagnosisDist={chartData.diagnosisDist}
          procedureDist={chartData.procedureDist}
          airwayDist={chartData.airwayDist}
          roleDist={chartData.roleDist}
          complicationDist={chartData.complicationDist}
          vasoactiveDist={chartData.vasoactiveDist}
          cpb={stats.cpb}
          total={stats.total}
        />
      )}
    </div>
  );
}

export default memo(Dashboard);
