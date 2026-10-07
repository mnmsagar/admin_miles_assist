import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { api } from '../lib/api';
import { Card, StatusBadge, Avatar, Spinner, ConfirmDialog } from '../components/ui';
import { money, date } from '../lib/format';
import type { Transaction } from '../lib/types';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-[13px] text-slate-500">{label}</span>
      <span className="text-right text-[13px] font-medium text-slate-800">
        {value ?? '—'}
      </span>
    </div>
  );
}

export default function TransactionDetail() {
  const { id } = useParams();
  const { data: t, loading, reload } = useApi<Transaction>(`/transactions/${id}`);
  const [refundOpen, setRefundOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function refund() {
    setBusy(true);
    try {
      await api.patch(`/transactions/${id}/status`, {
        status: 'REFUNDED',
        note: 'Refunded from admin console',
      });
      setRefundOpen(false);
      reload();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;
  if (!t) return <p className="text-slate-400">Transaction not found.</p>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 text-sm text-slate-400">
        <Link to="/transactions" className="hover:text-slate-600">
          Transactions
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-slate-600">{t.displayId}</span>
      </div>

      <Card className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                Transaction {t.displayId}
              </h1>
              <StatusBadge value={t.status} />
            </div>
            <p className="text-sm text-slate-500">
              Reference {t.reference} · {date(t.occurredAt, true)}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost h-9" onClick={() => window.print()}>
              Print Receipt
            </button>
            <button
              className="btn-ghost h-9 text-red-600 disabled:opacity-50"
              onClick={() => setRefundOpen(true)}
              disabled={t.status === 'REFUNDED'}
            >
              {t.status === 'REFUNDED' ? 'Refunded' : 'Refund'}
            </button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        onConfirm={refund}
        title="Refund Transaction"
        message={`Mark ${t.displayId} (${money(t.amount)}) as refunded? This updates its status and records an event.`}
        confirmLabel="Refund"
        danger
        busy={busy}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <h2 className="mb-2 font-semibold text-slate-900">
              Transaction Invoice Details
            </h2>
            <Row label="Transaction Type" value={t.type} />
            <Row label="Payment Method" value={t.paymentMethod} />
            <Row label="Processing Gateway Fee" value={t.gatewayFee ? money(t.gatewayFee) : '—'} />
            <Row label="Subtotal" value={t.subtotal ? money(t.subtotal) : '—'} />
            <Row
              label="Grand Total"
              value={
                <span className="text-base font-bold">
                  {money(t.grandTotal ?? t.amount)}
                </span>
              }
            />
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-slate-900">
              Related Customer Ledger Entries
            </h2>
            <div className="space-y-2">
              {t.ledger?.length ? (
                t.ledger.map((l) => (
                  <Link
                    to={`/transactions/${l.id}`}
                    key={l.id}
                    className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                  >
                    <span className="text-slate-600">{l.displayId}</span>
                    <span className="text-slate-400">{l.paymentMethod}</span>
                    <span className="font-medium">{money(l.amount)}</span>
                    <StatusBadge value={l.status} />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-400">No related entries</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 font-semibold text-slate-900">Customer Profile</h2>
            {t.user && (
              <Link
                to={`/users/${t.user.id}`}
                className="flex items-center gap-3 rounded-lg p-1 hover:bg-slate-50"
              >
                <Avatar name={t.user.fullName} size={44} />
                <div>
                  <p className="font-medium text-slate-800">{t.user.fullName}</p>
                  <p className="text-xs text-slate-400">
                    {t.user.email} · #{t.user.displayId}
                  </p>
                </div>
              </Link>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold text-slate-900">Processing History</h2>
            <div className="space-y-4">
              {t.events?.map((e) => (
                <div key={e.id} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{e.label}</p>
                    <p className="text-xs text-slate-500">{e.description}</p>
                    <p className="text-[11px] text-slate-400">
                      {date(e.occurredAt, true)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
