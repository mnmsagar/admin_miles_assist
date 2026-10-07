import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  DollarSign,
  CalendarCheck,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApi } from '../lib/useApi';
import { useAuth } from '../auth/AuthContext';
import { Card, StatCard, StatusBadge, Spinner, Avatar } from '../components/ui';
import { money, compactMoney, num, relative, date } from '../lib/format';
import type {
  DashboardStats,
  ChartSeries,
  Alert,
  Health,
  Paginated,
  Transaction,
} from '../lib/types';

const RANGES = ['7D', '1M', '3M', '6M', '1Y'];

const ALERT_ICON = {
  CRITICAL: AlertTriangle,
  WARNING: AlertTriangle,
  INFO: Info,
  SUCCESS: CheckCircle2,
};
const ALERT_COLOR = {
  CRITICAL: 'text-red-600 bg-error-light',
  WARNING: 'text-amber-600 bg-warning-light',
  INFO: 'text-blue-600 bg-info-light',
  SUCCESS: 'text-emerald-600 bg-success-light',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [range, setRange] = useState('6M');
  const { data: stats } = useApi<DashboardStats>('/dashboard/stats');
  const { data: chart } = useApi<ChartSeries>('/dashboard/charts', { range });
  const { data: alerts } = useApi<{ data: Alert[] }>('/dashboard/alerts');
  const { data: health } = useApi<Health>('/dashboard/health');
  const { data: recent } = useApi<Paginated<Transaction>>('/transactions', {
    limit: 4,
  });

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.fullName?.split(' ')[0]}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">{today}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats ? num(stats.totalUsers.value) : '—'}
          change={stats?.totalUsers}
          icon={<Users className="size-5" />}
        />
        <StatCard
          label="Total Revenue"
          value={stats ? money(stats.totalRevenue.total ?? stats.totalRevenue.value) : '—'}
          change={stats?.totalRevenue}
          icon={<DollarSign className="size-5" />}
        />
        <StatCard
          label="Active Bookings"
          value={stats ? num(stats.activeBookings.value) : '—'}
          change={stats?.activeBookings}
          icon={<CalendarCheck className="size-5" />}
        />
        <StatCard
          label="Pending Transactions"
          value={stats ? num(stats.pendingTransactions.value) : '—'}
          change={stats?.pendingTransactions}
          icon={<Clock className="size-5" />}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Revenue Overview</h2>
              <p className="text-xs text-slate-400">
                {chart?.series?.[0]?.label} – {chart?.series?.[chart.series.length - 1]?.label}
              </p>
            </div>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    range === r
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            {chart ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart.series} margin={{ left: -10, right: 8 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickFormatter={(l: string) => l.split(' ')[0]}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickFormatter={(v: number) => compactMoney(v)}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip
                    formatter={(v: number) => [money(v), 'Revenue']}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366F1"
                    strokeWidth={2}
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Spinner />
            )}
          </div>
        </Card>

        {/* System alerts */}
        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">System Alerts</h2>
          <div className="space-y-3">
            {alerts?.data.map((a) => {
              const Icon = ALERT_ICON[a.severity] ?? Info;
              return (
                <div key={a.id} className="flex gap-3">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${ALERT_COLOR[a.severity]}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.description}</p>
                    <p className="text-[11px] text-slate-400">{relative(a.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent transactions */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent Transactions</h2>
            <Link to="/transactions" className="text-sm font-medium text-brand-600">
              View All
            </Link>
          </div>
          <div className="space-y-1">
            {recent?.data.map((t) => (
              <Link
                to={`/transactions/${t.id}`}
                key={t.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
              >
                <Avatar name={t.user?.fullName ?? '?'} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {t.user?.fullName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t.displayId} · {date(t.occurredAt)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {money(t.amount)}
                </span>
                <StatusBadge value={t.status} />
              </Link>
            ))}
          </div>
        </Card>

        {/* System health */}
        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">System Health</h2>
          <div className="space-y-4">
            <HealthRow
              label="Uptime"
              value={`${health?.uptimePercent ?? '—'}%`}
              icon={<CheckCircle2 className="size-4 text-emerald-600" />}
            />
            <HealthRow
              label="Avg Response Time"
              value={`${health?.avgResponseTimeMs ?? '—'}ms`}
              icon={<Clock className="size-4 text-blue-600" />}
            />
            <HealthRow
              label="Active Sessions"
              value={health ? num(health.activeSessions) : '—'}
              icon={<Users className="size-4 text-brand-600" />}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function HealthRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-slate-500">
        {icon}
        {label}
      </span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
