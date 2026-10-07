import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { useApi } from '../lib/useApi';
import {
  StatCard,
  StatusBadge,
  Badge,
  Avatar,
  Pagination,
  Spinner,
  EmptyState,
  PageHeader,
} from '../components/ui';
import { AddUserModal } from '../components/AddUserModal';
import { num, date, relative } from '../lib/format';
import type { Paginated, User } from '../lib/types';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newThisMonth: number;
}

export default function Users() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [addOpen, setAddOpen] = useState(false);

  const { data: stats, reload: reloadStats } = useApi<UserStats>('/users/stats');
  const { data, loading, reload } = useApi<Paginated<User>>('/users', {
    page,
    limit,
    search,
    role,
    status,
  });

  function afterCreate() {
    reload();
    reloadStats();
  }

  return (
    <div>
      <PageHeader
        title="Users Directory"
        subtitle="Manage all registered users in your application"
        action={
          <button className="btn-primary h-9" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> Add User
          </button>
        }
      />

      <AddUserModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={afterCreate}
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Users" value={stats ? num(stats.totalUsers) : '—'} />
        <StatCard label="Active Users" value={stats ? num(stats.activeUsers) : '—'} />
        <StatCard label="New This Month" value={stats ? num(stats.newThisMonth) : '—'} />
      </div>

      <div className="card p-4">
        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="input md:w-40"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Role: All</option>
            <option value="ADMIN">Admin</option>
            <option value="EDITOR">Editor</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <select
            className="input md:w-44"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Status: All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {loading ? (
          <Spinner />
        ) : !data || data.data.length === 0 ? (
          <EmptyState message="No users found" />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-3">User</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Join Date</th>
                    <th className="px-3 py-3">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-3 py-3">
                        <Link to={`/users/${u.id}`} className="flex items-center gap-3">
                          <Avatar name={u.fullName} />
                          <div>
                            <p className="font-medium text-slate-800">{u.fullName}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <Badge
                          tone={
                            u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'
                              ? 'brand'
                              : u.role === 'EDITOR'
                                ? 'info'
                                : 'slate'
                          }
                        >
                          {u.role.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge value={u.status} />
                      </td>
                      <td className="px-3 py-3 text-slate-500">{date(u.joinedAt)}</td>
                      <td className="px-3 py-3 text-slate-500">
                        {relative(u.lastActiveAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
              {data.data.map((u) => (
                <Link
                  to={`/users/${u.id}`}
                  key={u.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
                >
                  <Avatar name={u.fullName} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{u.fullName}</p>
                    <p className="truncate text-xs text-slate-400">{u.email}</p>
                    <div className="mt-1 flex gap-1.5">
                      <StatusBadge value={u.status} />
                      <Badge tone="slate">{u.role.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
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
