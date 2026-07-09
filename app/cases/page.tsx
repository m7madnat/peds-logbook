'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import FilterSidebar from '@/components/FilterSidebar';
import FilterDrawer from '@/components/FilterDrawer';
import CaseRow from '@/components/CaseRow';
import { Skeleton, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { AnesthesiaCase, CaseFilters } from '@/lib/types';

type SortKey = 'date' | 'case_number' | 'diagnosis' | 'procedure' | 'role';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 15;

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'case_number', label: 'Case' },
  { key: 'date', label: 'Date' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'procedure', label: 'Procedure' },
  { key: 'role', label: 'Role' },
];

function RowSkeleton() {
  return (
    <div className="hidden md:grid grid-cols-[88px_100px_1.3fr_1.3fr_1fr_1fr_auto] items-center gap-4 px-4 py-3.5 border-b border-line">
      <Skeleton className="h-3.5 w-8" />
      <Skeleton className="h-3.5 w-16" />
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="h-3.5 w-16" />
      <Skeleton className="h-5 w-14" />
      <span />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="md:hidden rounded-xl2 border border-line bg-raised px-4 py-3.5 space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3.5 w-32" />
    </div>
  );
}

export default function CasesPage() {
  const [cases, setCases] = useState<AnesthesiaCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<CaseFilters>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function loadCases() {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (filters.diagnosis) params.set('diagnosis', filters.diagnosis);
    if (filters.procedure) params.set('procedure', filters.procedure);
    if (filters.cpb) params.set('cpb', filters.cpb);
    if (filters.ageGroup) params.set('ageGroup', filters.ageGroup);
    if (filters.airwayDifficulty) params.set('airwayDifficulty', filters.airwayDifficulty);

    setLoading(true);
    setError(null);
    fetch(`/api/cases?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error('Server returned an error');
        return r.json();
      })
      .then((d) => setCases(d.cases ?? []))
      .catch(() => setError('Could not load cases. Check your connection and try again.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(loadCases, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filters]);

  useEffect(() => {
    setPage(1);
  }, [q, filters, sortKey, sortDir]);

  const sorted = useMemo(() => {
    const copy = [...cases];
    copy.sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [cases, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const empty = !loading && !error && cases.length === 0;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'date' || key === 'case_number' ? 'desc' : 'asc');
    }
  }

  return (
    <main className="flex-1 flex flex-col">
      <TopBar
        title="Cases"
        onSearchClick={() => setDrawerOpen(true)}
        searchActive={activeFilterCount > 0}
      />

      <div className="mx-auto max-w-6xl w-full flex flex-1">
        <FilterSidebar filters={filters} onChange={setFilters} />

        <div className="flex-1 min-w-0 px-4 py-4">
          {/* Search + summary row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" stroke="#8CA0B3" strokeWidth="2" />
                <path d="M21 21l-4.3-4.3" stroke="#8CA0B3" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <label htmlFor="case-search" className="sr-only">
                Search cases
              </label>
              <input
                id="case-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search diagnosis, procedure, notes…"
                className="w-full rounded-xl bg-surface border border-line pl-10 pr-4 py-3 text-paper placeholder:text-subtle focus:border-mint focus:ring-1 focus:ring-mint/40 outline-none transition-colors"
              />
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden relative rounded-xl border border-line bg-surface h-[46px] w-[46px] flex items-center justify-center hover:border-line2 transition-colors"
              aria-label={`Open filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 6h16M7 12h10M10 18h4" stroke="#E9EEF3" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-mint text-ink text-[11px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <p className="text-sm text-muted mb-3 px-0.5" aria-live="polite">
            {loading ? 'Loading…' : error ? ' ' : `${sorted.length} case${sorted.length === 1 ? '' : 's'}`}
          </p>

          {error && (
            <div className="text-center py-16 border border-dashed border-rose/40 rounded-xl2">
              <p className="text-rose font-medium">{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={loadCases}>
                Retry
              </Button>
            </div>
          )}

          {loading && !error && (
            <div className="rounded-xl2 border border-line overflow-hidden bg-raised/40 md:bg-transparent">
              <div className="flex flex-col gap-2.5 p-2.5 md:gap-0 md:p-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="md:contents">
                    <RowSkeleton />
                    <CardSkeleton />
                  </div>
                ))}
              </div>
            </div>
          )}

          {empty && (
            <div className="text-center py-16 border border-dashed border-line rounded-xl2 animate-fade-in">
              <p className="text-muted">No cases match yet.</p>
              <p className="text-sm text-subtle mt-1">Try clearing filters, or log your next case.</p>
              <Link href="/cases/new">
                <Button size="sm" className="mt-4">
                  Add your first case
                </Button>
              </Link>
            </div>
          )}

          {!loading && !error && !empty && (
            <>
              <div className="rounded-xl2 border border-line overflow-hidden bg-raised/40 md:bg-transparent animate-fade-in">
                {/* Sortable table header — md and up */}
                <div className="hidden md:grid grid-cols-[88px_100px_1.3fr_1.3fr_1fr_1fr_auto] gap-4 px-4 py-2.5 border-b border-line2 bg-surface">
                  {COLUMNS.map((col) => {
                    const active = sortKey === col.key;
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                        className={cn(
                          'field-label flex items-center gap-1 text-left hover:text-paper transition-colors',
                          active && 'text-mint'
                        )}
                      >
                        {col.label}
                        {active && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="transition-transform"
                            style={{ transform: sortDir === 'asc' ? 'rotate(180deg)' : 'none' }}
                            aria-hidden="true"
                          >
                            <path d="M6 9l6 6 6-6" stroke="#34D399" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                  <span className="field-label">Flags</span>
                </div>
                <div className="flex flex-col gap-2.5 p-2.5 md:gap-0 md:p-0">
                  {paged.map((c, i) => (
                    <div key={c.id} className="md:contents">
                      <CaseRow c={c} index={i} query={q} />
                    </div>
                  ))}
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-0.5">
                  <p className="text-sm text-subtle">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <FilterDrawer
        filters={filters}
        onChange={setFilters}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Floating Add Case button - mobile-first, thumb reachable */}
      <Link
        href="/cases/new"
        aria-label="Add case"
        className="md:hidden fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-mint text-ink shadow-overlay flex items-center justify-center active:scale-95 transition-transform"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="#0A121C" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </Link>
    </main>
  );
}
