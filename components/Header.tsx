'use client';

import { useRouter } from 'next/navigation';

export default function Header({
  title,
  back,
  right,
}: {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-2xl px-4 py-3.5 flex items-center gap-3">
        {back && (
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="h-10 w-10 -ml-1.5 flex items-center justify-center rounded-full hover:bg-raised2 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="#E9EEF3"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <h1 className="text-base font-semibold tracking-tight truncate">{title}</h1>
        {right && <div className="ml-auto">{right}</div>}
      </div>
    </header>
  );
}
