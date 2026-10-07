import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../lib/useApi';
import { relative } from '../lib/format';
import type { Alert } from '../lib/types';

const ICON = {
  CRITICAL: AlertTriangle,
  WARNING: AlertTriangle,
  INFO: Info,
  SUCCESS: CheckCircle2,
} as const;

const COLOR = {
  CRITICAL: 'text-red-600 bg-error-light',
  WARNING: 'text-amber-600 bg-warning-light',
  INFO: 'text-blue-600 bg-info-light',
  SUCCESS: 'text-emerald-600 bg-success-light',
} as const;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data, reload } = useApi<{ data: Alert[]; unreadCount: number }>(
    '/dashboard/alerts',
  );
  const unread = data?.unreadCount ?? 0;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function markAllRead() {
    await api.patch('/dashboard/alerts/read');
    reload();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-900">
              Notifications
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                <Check className="size-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {data && data.data.length > 0 ? (
              data.data.map((a) => {
                const Icon = ICON[a.severity] ?? Info;
                return (
                  <div
                    key={a.id}
                    className="flex gap-3 border-b border-slate-50 px-4 py-3 last:border-0 hover:bg-slate-50"
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${COLOR[a.severity]}`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">
                        {a.title}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {a.description}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {relative(a.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                No notifications
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
