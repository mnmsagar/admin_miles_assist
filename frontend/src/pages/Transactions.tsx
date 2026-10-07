import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Download, Eye } from 'lucide-react';
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
} from '../components/ui';
import { money, num, date } from '../lib/format';
import type { Paginated, Transaction } from '../lib/types';

interface TxnStats {
  totalTransactions: number;
  totalVolume: number;
  avgTransaction: number;
  successRate: number;
}

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: stats } = useApi<TxnStats>('/transactions/stats');
  const { data, loading } = useApi<Paginated<Transaction>>('/transactions', {
    page,
    limit,
    search,
    type,
    status,
  });

  function exportCsv() {
    api.download(
      '/transactions/export',
      { search, type, status },
      `transactions-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  }

  return (
    <div>
      <PageHeader
        title="Transaction History"
        subtitle="Monitor and manage all financial transactions"
        action={
          <button className="btn-ghost h-9" onClick={exportCsv}>
            <Download className="size-4" /> Export CSV
          </button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Transactions" value={stats ? num(stats.totalTransactions) : '—'} />
        <StatCard label="Total Volume" value={stats ? money(stats.totalVolume) : '—'} />
        <StatCard label="Avg. Transaction" value={stats ? money(stats.avgTransaction) : '—'} />
        <StatCard label="Success Rate" value={stats ? `${stats.successRate}%` : '—'} />
      </div>

      <div className="card p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search ID or user..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="input md:w-44"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Type: All</option>
            <option value="PAYMENT">Payment</option>
            <option value="REFUND">Refund</option>
            <option value="TRANSFER">Transfer</option>
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
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        {loading ? (
          <Spinner />
        ) : !data || data.data.length === 0 ? (
          <EmptyState message="No transactions found" />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-3">Transaction ID</th>
                    <th className="px-3 py-3">User</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Date &amp; Time</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-3 py-3">
                        <Link
                          to={`/transactions/${t.id}`}
                          className="font-medium text-brand-600"
                        >
                          {t.displayId}
                        </Link>
                      </td>
                      <td className="px-3 py-3">{t.user?.fullName}</td>
                      <td className="px-3 py-3">
                        <Badge tone="slate">{t.type}</Badge>
                      </td>
                      <td
                        className={`px-3 py-3 font-semibold ${
                          Number(t.amount) < 0 ? 'text-red-600' : 'text-slate-900'
                        }`}
                      >
                        {money(t.amount)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge value={t.status} />
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {date(t.occurredAt, true)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end">
                          <Link
                            to={`/transactions/${t.id}`}
                            title="View"
                            className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                          >
                            <Eye className="size-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 md:hidden">
              {data.data.map((t) => (
                <Link
                  to={`/transactions/${t.id}`}
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
                >
                  <Avatar name={t.user?.fullName ?? '?'} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-brand-600">
                        {t.displayId}
                      </span>
                      <StatusBadge value={t.status} />
                    </div>
                    <p className="truncate text-sm font-medium text-slate-800">
                      {t.user?.fullName}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{date(t.occurredAt, true)}</span>
                      <span
                        className={`text-sm font-semibold ${
                          Number(t.amount) < 0 ? 'text-red-600' : 'text-slate-900'
                        }`}
                      >
                        {money(t.amount)}
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
