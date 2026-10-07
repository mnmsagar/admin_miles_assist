import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, X } from 'lucide-react';

type Tone = 'success' | 'warning' | 'error' | 'info' | 'brand' | 'slate';

const toneClasses: Record<Tone, string> = {
  success: 'bg-success-light text-emerald-700',
  warning: 'bg-warning-light text-amber-700',
  error: 'bg-error-light text-red-700',
  info: 'bg-info-light text-blue-700',
  brand: 'bg-brand-50 text-brand-700',
  slate: 'bg-slate-100 text-slate-600',
};

const STATUS_TONE: Record<string, Tone> = {
  // transaction / payment
  COMPLETED: 'success',
  PAID: 'success',
  PENDING: 'warning',
  FAILED: 'error',
  REFUNDED: 'slate',
  UNPAID: 'warning',
  // booking
  CONFIRMED: 'info',
  CANCELLED: 'error',
  // account
  ACTIVE: 'success',
  INACTIVE: 'warning',
  SUSPENDED: 'error',
  // roles
  SUPER_ADMIN: 'brand',
  ADMIN: 'brand',
  EDITOR: 'info',
  VIEWER: 'slate',
};

export function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  const t = tone ?? 'slate';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[t]}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const label = value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return <Badge tone={STATUS_TONE[value] ?? 'slate'}>{label}</Badge>;
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function StatCard({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: string;
  change?: { changePercent: number; direction: 'up' | 'down' | 'neutral' };
  icon?: ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        {icon && (
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {change && change.direction !== 'neutral' && (
        <p className="mt-1 flex items-center gap-1 text-xs">
          <span
            className={`flex items-center gap-0.5 font-medium ${
              change.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {change.direction === 'up' ? (
              <ArrowUp className="size-3" />
            ) : (
              <ArrowDown className="size-3" />
            )}
            {Math.abs(change.changePercent)}%
          </span>
          <span className="text-slate-400">vs last month</span>
        </p>
      )}
    </div>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="flex items-center justify-between px-1 pt-4 text-[13px] text-slate-500">
      <span>
        Showing {from}-{to} of {total.toLocaleString()} results
      </span>
      <div className="flex gap-2">
        <button
          className="btn-ghost h-8 px-3 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="size-4" /> Previous
        </button>
        <button
          className="btn-ghost h-8 px-3 disabled:opacity-40"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <div className="size-6 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center text-sm text-slate-400">{message}</div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="card max-h-[90vh] w-full max-w-md overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}
