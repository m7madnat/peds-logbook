'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Toast, Spinner } from '@/components/ui';
import { useToast } from '@/lib/useToast';

export default function TopBar({
  title,
  back,
  onSearchClick,
  searchActive,
}: {
  title: string;
  back?: boolean;
  onSearchClick?: () => void;
  searchActive?: boolean;
}) {
  const router = useRouter();
  const { toast, show } = useToast();
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] || 'peds-anesthesia-log.csv';

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      show('CSV exported', 'success');
    } catch {
      show('Export failed — try again', 'error');
    } finally {
      setExporting(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-line">
      <Toast message={toast?.message ?? null} tone={toast?.tone} />
      <div className="mx-auto max-w-6xl px-4 py-3.5 flex items-center gap-3">
        {back && (
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="h-10 w-10 -ml-1.5 flex items-center justify-center rounded-full hover:bg-raised2 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke="#E9EEF3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 shrink-0 rounded-md bg-mint/10 flex items-center justify-center" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" stroke="#34D399" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="12" cy="12" r="4.2" stroke="#34D399" strokeWidth="1.6" />
            </svg>
          </div>
          <h1 className="text-base font-semibold tracking-tight truncate">{title}</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {onSearchClick && (
            <Button
              variant={searchActive ? 'secondary' : 'ghost'}
              size="icon"
              onClick={onSearchClick}
              aria-label="Search and filter cases"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="#E9EEF3" strokeWidth="2" />
                <path d="M21 21l-4.3-4.3" stroke="#E9EEF3" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={handleExport}
            disabled={exporting}
            aria-label="Export cases as CSV"
            className="sm:w-auto sm:px-4 sm:gap-2"
          >
            {exporting ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" stroke="#E9EEF3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export'}</span>
          </Button>

          <Link href="/cases/new">
            <Button size="default" className="gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="#0A121C" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:inline">Add Case</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
