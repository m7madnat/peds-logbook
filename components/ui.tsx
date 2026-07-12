'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/* ---------------------------------- Card ---------------------------------- */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl2 border border-line bg-raised shadow-card transition-shadow duration-150',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 pt-4', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 pb-4', className)} {...props} />;
}

/* --------------------------------- Button --------------------------------- */

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-mint text-ink hover:bg-mint2',
        secondary: 'bg-raised2 text-paper border border-line2 hover:border-mint/50',
        ghost: 'bg-transparent text-paper hover:bg-raised2',
        outline: 'bg-transparent border border-line2 text-paper hover:bg-raised2',
        destructive: 'bg-transparent border border-rose text-rose hover:bg-rose/10',
      },
      size: {
        default: 'h-11 px-4 text-sm',
        lg: 'h-14 px-5 text-base',
        icon: 'h-11 w-11',
        sm: 'h-9 px-3 text-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ className, variant, size, loading, disabled, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin h-4 w-4', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* --------------------------------- Badge ---------------------------------- */

const badgeVariants = cva('inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold tracking-wide', {
  variants: {
    variant: {
      default: 'bg-raised2 text-muted',
      mint: 'bg-mint/10 text-mint',
      info: 'bg-info/10 text-info',
      amber: 'bg-amber/10 text-amber',
      rose: 'bg-rose/10 text-rose',
    },
  },
  defaultVariants: { variant: 'default' },
});

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/* --------------------------------- Label ---------------------------------- */

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('field-label block mb-1.5', className)} {...props} />;
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-subtle">{hint}</p>}
    </div>
  );
}

/* --------------------------------- Inputs --------------------------------- */

const controlClass =
  'w-full rounded-xl bg-surface border border-line px-4 py-3.5 text-paper placeholder:text-subtle focus:border-mint focus:ring-1 focus:ring-mint/40 outline-none transition-colors';

export const TextInput = React.forwardRef<
  HTMLInputElement,
  {
    value: string | null | undefined;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    maxLength?: number;
  }
>(function TextInput({ value, onChange, placeholder, type = 'text', maxLength }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className={controlClass}
    />
  );
});

export const NumberInput = React.forwardRef<
  HTMLInputElement,
  {
    value: number | null | undefined;
    onChange: (v: number | null) => void;
    placeholder?: string;
    step?: string;
  }
>(function NumberInput({ value, onChange, placeholder, step }, ref) {
  return (
    <input
      ref={ref}
      type="number"
      inputMode="decimal"
      step={step ?? 'any'}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      placeholder={placeholder}
      className={cn(controlClass, 'tabular-nums')}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  {
    value: string | null | undefined;
    onChange: (v: string) => void;
    options: readonly string[];
    placeholder?: string;
  }
>(function Select({ value, onChange, options, placeholder }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={cn(controlClass, 'appearance-none pr-10 cursor-pointer')}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path d="M6 9l6 6 6-6" stroke="#8CA0B3" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
});

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between rounded-xl bg-surface border border-line px-4 py-3.5 transition-colors hover:border-line2"
    >
      <span className="text-paper text-sm">{label}</span>
      <span
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-150',
          checked ? 'bg-mint' : 'bg-line2'
        )}
      >
        <span
          className={cn(
            'inline-block h-[18px] w-[18px] transform rounded-full bg-ink transition-transform duration-150',
            checked ? 'translate-x-[22px]' : 'translate-x-[3px]'
          )}
        />
      </span>
    </button>
  );
}

export function CheckboxGroup<T extends string>({
  values,
  onChange,
  options,
  columns = 2,
}: {
  values: T[];
  onChange: (v: T[]) => void;
  options: readonly T[];
  columns?: 1 | 2;
}) {
  function toggle(opt: T) {
    onChange(values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt]);
  }

  return (
    <div className={cn('grid gap-2', columns === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
      {options.map((opt) => {
        const checked = values.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={() => toggle(opt)}
            className={cn(
              'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm text-left transition-colors duration-150',
              checked ? 'bg-mint/10 border-mint text-mint font-medium' : 'bg-surface border-line text-paper hover:border-line2'
            )}
          >
            <span
              className={cn(
                'flex h-4.5 w-4.5 h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors',
                checked ? 'bg-mint border-mint' : 'border-line2'
              )}
            >
              {checked && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" stroke="#0A121C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedGroup({
  value,
  onChange,
  options,
  columns = 3,
}: {
  value: string | null | undefined;
  onChange: (v: string) => void;
  options: readonly string[];
  columns?: 2 | 3 | 4;
}) {
  const colClass = columns === 2 ? 'grid-cols-2' : columns === 4 ? 'grid-cols-4' : 'grid-cols-3';
  return (
    <div className={cn('grid gap-2', colClass)}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'rounded-xl border px-2 py-3 text-sm font-medium transition-colors duration-150',
              active
                ? 'bg-mint text-ink border-mint'
                : 'bg-surface text-paper border-line hover:border-line2'
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function Collapsible({
  title,
  step,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  title: string;
  step?: number;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const contentId = React.useId();

  function toggle() {
    const next = !open;
    if (onOpenChange) onOpenChange(next);
    else setInternalOpen(next);
  }

  return (
    <div className="rounded-xl2 border border-line bg-raised overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={contentId}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <span className="flex items-center gap-2.5">
          {step != null && (
            <span className="h-6 w-6 rounded-md bg-mint/10 text-mint text-xs font-bold flex items-center justify-center shrink-0">
              {step}
            </span>
          )}
          <span className="text-sm font-semibold tracking-tight">{title}</span>
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="transition-transform duration-200 shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" stroke="#8CA0B3" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {/* grid-rows 0fr/1fr trick: animates height without measuring the DOM */}
      <div
        id={contentId}
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1 space-y-4 border-t border-line">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <Collapsible title={title} defaultOpen={defaultOpen}>
      {children}
    </Collapsible>
  );
}

/* ---------------------------- Searchable combobox --------------------------- */
// A lightweight, dependency-free combobox: a trigger button that opens an
// inline filter+list panel (not a modal/dialog). Exposes open()/focus() via
// ref so the form can auto-advance straight into the next field's search.

export interface SearchableSelectHandle {
  open: () => void;
  focus: () => void;
}

export const SearchableSelect = React.forwardRef<
  SearchableSelectHandle,
  {
    value: string | null | undefined;
    onChange: (v: string) => void;
    options: readonly string[];
    placeholder?: string;
  }
>(function SearchableSelect({ value, onChange, options, placeholder }, ref) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    focus: () => triggerRef.current?.focus(),
  }));

  React.useEffect(() => {
    if (open) {
      setQuery('');
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [open]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    if (open) {
      document.addEventListener('mousedown', onDocClick);
      document.addEventListener('keydown', onKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          controlClass,
          'flex items-center justify-between text-left',
          !value && 'text-subtle'
        )}
      >
        <span className="truncate">{value || placeholder || 'Select'}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 ml-2" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="#8CA0B3" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-40 mt-1.5 w-full rounded-xl border border-line2 bg-raised shadow-overlay overflow-hidden animate-fade-in">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search…"
            className="w-full bg-surface border-b border-line px-4 py-3 text-paper placeholder:text-subtle outline-none"
          />
          <div className="max-h-52 overflow-y-auto thin-scroll" role="listbox">
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-sm text-subtle">No matches</p>
            )}
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={value === opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={cn(
                  'w-full text-left px-4 py-3 text-sm hover:bg-raised2 transition-colors',
                  value === opt && 'text-mint font-medium'
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

/* --------------------------------- Toast ---------------------------------- */

export function Toast({ message, tone = 'success' }: { message: string | null; tone?: 'success' | 'error' | 'info' }) {
  if (!message) return null;
  const toneStyles =
    tone === 'error'
      ? { border: 'border-rose/40', icon: '#F0555B' }
      : tone === 'info'
      ? { border: 'border-info/40', icon: '#5B9BFF' }
      : { border: 'border-mint/40', icon: '#34D399' };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed top-4 left-1/2 -translate-x-1/2 z-[60] rounded-xl bg-raised2 border px-4 py-2.5 shadow-overlay animate-fade-in flex items-center gap-2',
        toneStyles.border
      )}
    >
      {tone === 'error' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke={toneStyles.icon} strokeWidth="2" />
          <path d="M12 8v5M12 16h.01" stroke={toneStyles.icon} strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 13l4 4L19 7" stroke={toneStyles.icon} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span className="text-sm font-medium text-paper">{message}</span>
    </div>
  );
}

/* ------------------------------ Confirm dialog ----------------------------- */
// A themed, accessible replacement for window.confirm() - used before any
// destructive action (delete case, etc).

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  danger = true,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full sm:max-w-sm bg-raised border border-line2 rounded-t-xl2 sm:rounded-xl2 shadow-overlay p-5 space-y-4 animate-fade-up">
        <div>
          <h2 id="confirm-dialog-title" className="text-base font-semibold text-paper">
            {title}
          </h2>
          {description && <p className="text-sm text-muted mt-1.5">{description}</p>}
        </div>
        <div className="flex gap-2.5">
          <Button variant="outline" size="default" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={danger ? 'destructive' : 'primary'}
            size="default"
            className={cn('flex-1', danger && 'bg-rose text-paper border-rose hover:bg-rose/90')}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Skeleton -------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-raised2', className)} />;
}
