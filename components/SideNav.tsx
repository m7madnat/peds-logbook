'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Dashboard', icon: DashIcon },
  { href: '/cases', label: 'Cases', icon: ListIcon },
  { href: '/cases/new', label: 'Add', icon: PlusIcon },
];

export default function SideNav() {
  const pathname = usePathname();
  if (pathname === '/login') return null;

  return (
    <nav
      className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 w-20 flex-col items-center gap-1 border-r border-line bg-surface py-5"
      aria-label="Primary"
    >
      <div className="h-9 w-9 mb-4 rounded-lg bg-mint/10 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" stroke="#34D399" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="12" r="4.2" stroke="#34D399" strokeWidth="1.6" />
        </svg>
      </div>
      {ITEMS.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 w-16 py-2.5 rounded-xl transition-colors ${
              active ? 'text-mint bg-mint/10' : 'text-muted hover:bg-raised2'
            }`}
          >
            <item.icon active={active} />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function DashIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z" fill={active ? '#34D399' : '#8CA0B3'} />
    </svg>
  );
}
function ListIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h16M4 18h16" stroke={active ? '#34D399' : '#8CA0B3'} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function PlusIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={active ? '#34D399' : '#8CA0B3'} strokeWidth="2" />
      <path d="M12 8v8M8 12h8" stroke={active ? '#34D399' : '#8CA0B3'} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
