'use client';

import FilterGroups from '@/components/FilterGroups';
import type { CaseFilters } from '@/lib/types';

export default function FilterDrawer({
  filters,
  onChange,
  open,
  onClose,
}: {
  filters: CaseFilters;
  onChange: (f: CaseFilters) => void;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-[86%] max-w-sm bg-surface border-r border-line flex flex-col shadow-overlay animate-slide-in-left">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <p className="text-base font-semibold">Filters</p>
          <button onClick={onClose} className="text-mint text-sm font-medium px-2 py-1.5">
            Done
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 thin-scroll">
          <FilterGroups filters={filters} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
