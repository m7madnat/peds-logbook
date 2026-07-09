'use client';

import FilterGroups from '@/components/FilterGroups';
import type { CaseFilters } from '@/lib/types';

export default function FilterSidebar({
  filters,
  onChange,
}: {
  filters: CaseFilters;
  onChange: (f: CaseFilters) => void;
}) {
  return (
    <aside className="hidden lg:block w-72 shrink-0 border-r border-line bg-surface/40 min-h-[calc(100vh-64px)] px-5 py-6 sticky top-[65px] self-start thin-scroll overflow-y-auto max-h-[calc(100vh-65px)]">
      <p className="text-sm font-semibold mb-4">Filters</p>
      <FilterGroups filters={filters} onChange={onChange} />
    </aside>
  );
}
