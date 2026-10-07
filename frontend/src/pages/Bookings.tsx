import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { useApi } from '../lib/useApi';
import {
  StatCard,
  StatusBadge,
  Avatar,
  Pagination,
  Spinner,
  EmptyState,
  PageHeader,
} from '../components/ui';
import { NewBookingModal } from '../components/NewBookingModal';
import { money, num, date, titleCase, duration } from '../lib/format';
import type { Paginated, Booking, Kpi } from '../lib/types';

interface BookingStats {
  totalBookings: Kpi;
  activeBookings: Kpi;
  completedBookings: Kpi;
  cancelledBookings: Kpi;
}

const SERVICE_TYPES = [
  'BUSINESS_CONSULTATION',
  'TECHNICAL_SUPPORT',
  'EXECUTIVE_COACHING',
  'STRATEGY_SESSION',
  'PERSONAL_TRAINING',
  'IT_CONSULTATION',
  'EXECUTIVE_TRAINING',
  'PLATFORM_AUDIT',
  'DATABASE_MIGRATION',
  'SECURITY_ASSESSMENT',
];

export default function Bookings() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [addOpen, setAddOpen] = useState(false);

  const { data: stats, reload: reloadStats } = useApi<BookingStats>('/bookings/stats');
  const { data, loading, reload } = useApi<Paginated<Booking>>('/bookings', {
    page,
    limit,
    search,
    status,
    serviceType,
  });

  function afterCreate() {
    reload();
    reloadStats();
  }

  return (
    <div>
      <PageHeader
        title="Bookings Directory"
        subtitle="Manage all service bookings and consultation meetings"
        action={
          <button className="btn-primary h-9" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> New Booking
          </button>
        }
      />

      <NewBookingModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={afterCreate}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Bookings"
          value={stats ? num(stats.totalBookings.value) : '—'}
          change={stats?.totalBookings}
        />
        <StatCard
          label="Active Bookings"
          value={stats ? num(stats.activeBookings.value) : '—'}
          change={stats?.activeBookings}
        />
        <StatCard
          label="Completed"
          value={stats ? num(stats.completedBookings.value) : '—'}
          change={stats?.completedBookings}
        />
        <StatCard
          label="Cancelled"
          value={stats ? num(stats.cancelledBookings.value) : '—'}
          change={stats?.cancelledBookings}
        />
      </div>

      <div className="card p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search bookings by ID or client..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="input md:w-44"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Status: All</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            className="input md:w-52"
            value={serviceType}
            onChange={(e) => {
              setServiceType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Service: All</option>
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <Spinner />
        ) : !data || data.data.length === 0 ? (
          <EmptyState message="No bookings found" />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-3">Booking ID</th>
                    <th className="px-3 py-3">Customer</th>
                    <th className="px-3 py-3">Service</th>
                    <th className="px-3 py-3">Date &amp; Time</th>
                    <th className="px-3 py-3">Duration</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-3 py-3">
                        <Link
                          to={`/bookings/${b.id}`}
                          className="font-medium text-brand-600"
                        >
                          {b.displayId}
                        </Link>
                      </td>
                      <td className="px-3 py-3">{b.user?.fullName}</td>
                      <td className="px-3 py-3 text-slate-600">
                        {titleCase(b.serviceType)}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {date(b.scheduledAt, true)}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {duration(b.durationMinutes)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge value={b.status} />
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        {money(b.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 md:hidden">
              {data.data.map((b) => (
                <Link
                  to={`/bookings/${b.id}`}
                  key={b.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
                >
                  <Avatar name={b.user?.fullName ?? '?'} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-brand-600">
                        {b.displayId}
                      </span>
                      <StatusBadge value={b.status} />
                    </div>
                    <p className="truncate text-sm font-medium text-slate-800">
                      {b.user?.fullName}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs text-slate-400">
                        {titleCase(b.serviceType)}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {money(b.amount)}
                      </span>
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
