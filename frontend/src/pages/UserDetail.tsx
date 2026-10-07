import { Link, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { Card, StatusBadge, Avatar, Spinner, Badge } from '../components/ui';
import { date, relative, money } from '../lib/format';
import type { User } from '../lib/types';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-[13px] text-slate-500">{label}</span>
      <span className="text-right text-[13px] font-medium text-slate-800">
        {value || '—'}
      </span>
    </div>
  );
}

export default function UserDetail() {
  const { id } = useParams();
  const { data: user, loading } = useApi<User>(`/users/${id}`);

  if (loading) return <Spinner />;
  if (!user) return <p className="text-slate-400">User not found.</p>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 text-sm text-slate-400">
        <Link to="/users" className="hover:text-slate-600">
          Users
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-slate-600">{user.fullName}</span>
      </div>

      {/* Header */}
      <Card className="mb-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={user.fullName} size={64} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{user.fullName}</h1>
              <StatusBadge value={user.status} />
              <Badge tone="brand">{user.role.replace('_', ' ')}</Badge>
            </div>
            <p className="text-sm text-slate-500">
              {user.email} · Joined {date(user.joinedAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost h-9">Edit Profile</button>
            <button className="btn-ghost h-9 text-red-600">Suspend User</button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <h2 className="mb-2 font-semibold text-slate-900">Personal Information</h2>
            <Row label="Full Name" value={user.fullName} />
            <Row label="Email Address" value={user.email} />
            <Row label="Phone Number" value={user.phone} />
            <Row
              label="Date of Birth"
              value={user.dateOfBirth ? date(user.dateOfBirth) : '—'}
            />
            <Row label="Mailing Address" value={user.mailingAddress} />
          </Card>

          <Card>
            <h2 className="mb-2 font-semibold text-slate-900">Account Information</h2>
            <Row label="User ID" value={`#${user.displayId}`} />
            <Row label="Joined Date" value={date(user.joinedAt)} />
            <Row label="Last Login Activity" value={relative(user.lastActiveAt)} />
            <Row
              label="Two-Factor Security"
              value={
                user.twoFactorEnabled ? (
                  <Badge tone="success">Enabled</Badge>
                ) : (
                  <Badge tone="slate">Disabled</Badge>
                )
              }
            />
          </Card>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-semibold text-slate-900">Recent Transactions</h2>
              <div className="space-y-2">
                {user.transactions?.length ? (
                  user.transactions.map((t) => (
                    <Link
                      to={`/transactions/${t.id}`}
                      key={t.id}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
                    >
                      <span className="text-slate-600">{t.displayId}</span>
                      <span className="font-medium">{money(t.amount)}</span>
                      <StatusBadge value={t.status} />
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No transactions</p>
                )}
              </div>
            </Card>
            <Card>
              <h2 className="mb-3 font-semibold text-slate-900">Recent Bookings</h2>
              <div className="space-y-2">
                {user.bookings?.length ? (
                  user.bookings.map((b) => (
                    <Link
                      to={`/bookings/${b.id}`}
                      key={b.id}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
                    >
                      <span className="text-slate-600">{b.displayId}</span>
                      <StatusBadge value={b.status} />
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No bookings</p>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Activity log */}
        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Recent Activity Log</h2>
          <div className="space-y-4">
            {user.activityLogs?.length ? (
              user.activityLogs.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.description}</p>
                    <p className="text-[11px] text-slate-400">{relative(a.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No activity</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
