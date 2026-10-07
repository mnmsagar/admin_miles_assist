import { useState } from 'react';
import { Search, ShieldAlert, RefreshCw } from 'lucide-react';
import { useApi } from '../lib/useApi';
import {
  Pagination,
  Spinner,
  EmptyState,
  PageHeader,
  Avatar,
  Badge,
} from '../components/ui';
import { date, relative } from '../lib/format';
import type { Paginated } from '../lib/types';

interface AuditLogEntry {
  id: string;
  adminUserId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  adminUser?: {
    id: string;
    displayId: string;
    fullName: string;
    email: string;
    role: string;
  };
}

function actionTone(action: string): 'emerald' | 'brand' | 'amber' | 'rose' | 'slate' {
  if (action.includes('CREATE') || action === 'AUTH_LOGIN') return 'emerald';
  if (action.includes('UPDATE') || action.includes('RESCHEDULE')) return 'brand';
  if (action.includes('CANCEL') || action.includes('SUSPEND') || action === 'AUTH_LOGOUT') return 'amber';
  if (action.includes('DELETE')) return 'rose';
  return 'slate';
}

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, loading, reload } = useApi<Paginated<AuditLogEntry>>('/audit-logs', {
    page,
    limit,
    search: search || undefined,
    action: action || undefined,
    entityType: entityType || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  return (
    <div>
      <PageHeader
        title="Admin Audit & Activity Logs"
        subtitle="Track every administrative action, user modification, and security event stored in PostgreSQL"
        action={
          <button
            onClick={() => reload()}
            className="btn-ghost h-9 text-slate-600 hover:text-slate-900"
            title="Refresh logs"
          >
            <RefreshCw className="size-4" /> Refresh
          </button>
        }
      />

      <div className="card p-4">
        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by admin name, action, or resource..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="input md:w-44"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Entity: All</option>
            <option value="User">User</option>
            <option value="Booking">Booking</option>
            <option value="Transaction">Transaction</option>
            <option value="AdminUser">Admin User</option>
            <option value="Auth">Auth</option>
          </select>

          <select
            className="input md:w-48"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Action: All</option>
            <option value="USER_CREATE">User Create</option>
            <option value="USER_UPDATE">User Update</option>
            <option value="USER_DELETE">User Delete</option>
            <option value="USER_BULK">User Bulk</option>
            <option value="BOOKING_CREATE">Booking Create</option>
            <option value="BOOKING_RESCHEDULE">Booking Reschedule</option>
            <option value="BOOKING_CANCEL">Booking Cancel</option>
            <option value="BOOKING_UPDATE">Booking Update</option>
            <option value="TRANSACTION_CREATE">Transaction Create</option>
            <option value="TRANSACTION_STATUS_UPDATE">Transaction Status</option>
            <option value="ADMIN_CREATE">Admin Create</option>
            <option value="ADMIN_UPDATE">Admin Update</option>
            <option value="AUTH_LOGIN">Login</option>
            <option value="AUTH_LOGOUT">Logout</option>
          </select>
        </div>

        {loading ? (
          <Spinner />
        ) : !data || data.data.length === 0 ? (
          <EmptyState message="No audit logs found matching criteria" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-3">Timestamp</th>
                    <th className="px-3 py-3">Admin Operator</th>
                    <th className="px-3 py-3">Action</th>
                    <th className="px-3 py-3">Target Entity</th>
                    <th className="px-3 py-3">Details / Description</th>
                    <th className="px-3 py-3">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-3 py-3">
                        <div className="text-slate-800">{date(log.createdAt, true)}</div>
                        <div className="text-[11px] text-slate-400">
                          {relative(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {log.adminUser ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={log.adminUser.fullName} size={28} />
                            <div>
                              <div className="font-medium text-slate-800">
                                {log.adminUser.fullName}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {log.adminUser.email}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">
                            {log.adminUserId.slice(0, 8)}…
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={actionTone(log.action)}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-medium text-slate-700">
                          {log.entityType}
                        </span>
                        {log.entityId && (
                          <span className="ml-1 text-xs text-slate-400">
                            ({log.entityId.length > 15 ? log.entityId.slice(0, 8) + '…' : log.entityId})
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {log.description || '—'}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-400">
                        {log.ipAddress || 'localhost'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              limit={data.meta.limit}
              onPage={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
