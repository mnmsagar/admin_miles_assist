import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Loader2, Pencil, Trash2, Eye } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { api } from '../lib/api';
import {
  StatCard,
  StatusBadge,
  Badge,
  Avatar,
  Pagination,
  Spinner,
  EmptyState,
  PageHeader,
  Modal,
  Field,
  ConfirmDialog,
} from '../components/ui';
import { AddUserModal } from '../components/AddUserModal';
import { EditUserModal } from '../components/EditUserModal';
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

  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [roleOpen, setRoleOpen] = useState(false);
  const [newRole, setNewRole] = useState('VIEWER');
  const [busy, setBusy] = useState(false);

  const { data: stats, reload: reloadStats } = useApi<UserStats>('/users/stats');
  const { data, loading, reload } = useApi<Paginated<User>>('/users', {
    page,
    limit,
    search,
    role,
    status,
  });

  // clear selection whenever the result set changes
  useEffect(() => {
    setSelected(new Set());
  }, [page, search, role, status]);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (!data) return;
    const ids = data.data.map((u) => u.id);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected(allSelected ? new Set() : new Set(ids));
  }

  function afterChange() {
    reload();
    reloadStats();
  }

  async function doDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.del(`/users/${deleting.id}`);
      setDeleting(null);
      afterChange();
    } finally {
      setBusy(false);
    }
  }

  async function bulk(action: 'SUSPEND' | 'ACTIVATE' | 'CHANGE_ROLE', r?: string) {
    setBusy(true);
    try {
      await api.patch('/users/bulk', {
        ids: [...selected],
        action,
        ...(action === 'CHANGE_ROLE' ? { role: r } : {}),
      });
      setSelected(new Set());
      setRoleOpen(false);
      reload();
      reloadStats();
    } finally {
      setBusy(false);
    }
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
        onCreated={afterChange}
      />

      {editing && (
        <EditUserModal
          key={editing.id}
          user={editing}
          open
          onClose={() => setEditing(null)}
          onSaved={afterChange}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={doDelete}
        title="Delete User"
        message={`Delete ${deleting?.fullName}? This permanently removes the user and their transactions, bookings and activity.`}
        confirmLabel="Delete"
        danger
        busy={busy}
      />

      <Modal
        open={roleOpen}
        onClose={() => setRoleOpen(false)}
        title={`Change Role · ${selected.size} selected`}
      >
        <div className="space-y-3">
          <Field label="New Role">
            <select
              className="input"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="ADMIN">Admin</option>
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost h-9" onClick={() => setRoleOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary h-9"
              onClick={() => bulk('CHANGE_ROLE', newRole)}
              disabled={busy}
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              Apply
            </button>
          </div>
        </div>
      </Modal>

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

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5">
            <span className="text-sm font-medium text-brand-700">
              {selected.size} user{selected.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                className="btn-ghost h-8"
                onClick={() => setRoleOpen(true)}
                disabled={busy}
              >
                Change Role
              </button>
              <button
                className="btn-ghost h-8 text-red-600"
                onClick={() => bulk('SUSPEND')}
                disabled={busy}
              >
                Suspend Accounts
              </button>
              <button
                className="btn-ghost h-8 text-emerald-600"
                onClick={() => bulk('ACTIVATE')}
                disabled={busy}
              >
                Activate
              </button>
            </div>
          </div>
        )}

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
                    <th className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-slate-300 accent-brand-600"
                        checked={
                          data.data.length > 0 &&
                          data.data.every((u) => selected.has(u.id))
                        }
                        onChange={toggleAll}
                      />
                    </th>
                    <th className="px-3 py-3">User</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Join Date</th>
                    <th className="px-3 py-3">Last Active</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((u) => (
                    <tr
                      key={u.id}
                      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${
                        selected.has(u.id) ? 'bg-brand-50/50' : ''
                      }`}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-slate-300 accent-brand-600"
                          checked={selected.has(u.id)}
                          onChange={() => toggle(u.id)}
                        />
                      </td>
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
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            title="View"
                            onClick={() => navigate(`/users/${u.id}`)}
                            className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            title="Edit"
                            onClick={() => setEditing(u)}
                            className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            title="Delete"
                            onClick={() => setDeleting(u)}
                            className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-error-light hover:text-red-600"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
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
