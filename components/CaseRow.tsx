import { memo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui';
import { highlightMatch, cn } from '@/lib/utils';
import type { AnesthesiaCase } from '@/lib/types';

function badgesFor(c: AnesthesiaCase) {
  const badges: { label: string; variant: 'mint' | 'info' | 'amber' | 'default' }[] = [];
  if (c.cpb_used) badges.push({ label: 'CPB', variant: 'info' });
  if (c.tee_used) badges.push({ label: 'TEE', variant: 'mint' });
  if (c.arterial_line) badges.push({ label: 'A-line', variant: 'default' });
  if (c.central_line) badges.push({ label: 'CVL', variant: 'default' });
  if (c.ecmo_status && c.ecmo_status !== 'No ECMO') badges.push({ label: c.ecmo_status, variant: 'amber' });
  if (c.dhca_used) badges.push({ label: 'DHCA', variant: 'amber' });
  return badges;
}

/**
 * Renders as a structured, zebra-striped table row at md+ widths, and a
 * stacked clinical summary card below that. Both share the same data;
 * only one is visible at a given viewport width. Memoized since the case
 * list can run into the hundreds of rows over a fellowship.
 */
function CaseRow({ c, index = 0, query = '' }: { c: AnesthesiaCase; index?: number; query?: string }) {
  const badges = badgesFor(c);
  const striped = index % 2 === 1;

  return (
    <Link href={`/cases/${c.id}`} className="contents group">
      {/* Table row — md and up */}
      <div
        className={cn(
          'hidden md:grid grid-cols-[88px_100px_1.3fr_1.3fr_1fr_1fr_auto] items-center gap-4 px-4 py-3.5 border-b border-line hover:bg-raised2/60 transition-colors',
          striped && 'bg-surface/40'
        )}
      >
        <span className="font-mono text-xs text-muted">#{c.case_number}</span>
        <span className="text-sm tabular-nums text-muted">{c.date}</span>
        <span className="text-sm font-medium truncate">
          {c.diagnosis ? highlightMatch(c.diagnosis, query) : '—'}
        </span>
        <span className="text-sm truncate">{c.procedure ? highlightMatch(c.procedure, query) : '—'}</span>
        <span className="text-sm text-muted">{c.role}</span>
        <div className="flex flex-wrap gap-1">
          {badges.length > 0 ? (
            badges.map((b) => (
              <Badge key={b.label} variant={b.variant}>
                {b.label}
              </Badge>
            ))
          ) : (
            <span className="text-subtle text-sm">—</span>
          )}
        </div>
        <svg
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M9 6l6 6-6 6" stroke="#8CA0B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Stacked card — below md */}
      <div className="md:hidden rounded-xl2 border border-line bg-raised px-4 py-3.5 active:bg-raised2 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted font-mono">
              #{c.case_number} · {c.date}
            </p>
            <p className="font-medium mt-0.5 truncate">
              {c.procedure ? highlightMatch(c.procedure, query) : 'Procedure not set'}
            </p>
            <p className="text-sm text-muted truncate">
              {c.diagnosis ? highlightMatch(c.diagnosis, query) : '—'} · {c.role}
            </p>
          </div>
          <Badge>{c.service_type}</Badge>
        </div>
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {badges.map((b) => (
              <Badge key={b.label} variant={b.variant}>
                {b.label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export default memo(CaseRow);
