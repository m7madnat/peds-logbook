'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Dashboard', icon: DashIcon },
  { href: '/cases', label: 'Cases', icon: ListIcon },
  { href: '/cases/new', label: 'Add Case', icon: PlusIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname === '/login') return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-surface/95 backdrop-blur"
      aria-label="Primary"
    >
      <div className="mx-auto max-w-md grid grid-cols-3">
        {TABS.map((tab) => {
          const active =
            tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 py-3 min-h-[64px] justify-center transition-colors ${
                active ? 'text-mint' : 'text-muted'
              }`}
            >
              <tab.icon active={active} />
              <span className="text-[11px] leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function DashIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z"
        fill={active ? '#34D399' : '#8CA0B3'}
      />
    </svg>
  );
}
function ListIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke={active ? '#34D399' : '#8CA0B3'}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function PlusIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={active ? '#34D399' : '#8CA0B3'} strokeWidth="2" />
      <path d="M12 8v8M8 12h8" stroke={active ? '#34D399' : '#8CA0B3'} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
