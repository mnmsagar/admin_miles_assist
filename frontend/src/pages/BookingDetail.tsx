import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { api } from '../lib/api';
import {
  Card,
  StatusBadge,
  Avatar,
  Spinner,
  Badge,
  ConfirmDialog,
} from '../components/ui';
import { RescheduleBookingModal } from '../components/RescheduleBookingModal';
import { money, date, titleCase, duration } from '../lib/format';
import type { Booking } from '../lib/types';

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

export default function BookingDetail() {
  const { id } = useParams();
  const { data: b, loading, reload } = useApi<Booking>(`/bookings/${id}`);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function cancelBooking() {
    setBusy(true);
    try {
      await api.patch(`/bookings/${id}`, { status: 'CANCELLED' });
      setCancelOpen(false);
      reload();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;
  if (!b) return <p className="text-slate-400">Booking not found.</p>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 text-sm text-slate-400">
        <Link to="/bookings" className="hover:text-slate-600">
          Bookings
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-slate-600">{b.displayId}</span>
      </div>

      <Card className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                Booking {b.displayId}
              </h1>
              <StatusBadge value={b.status} />
            </div>
            <p className="text-sm text-slate-500">
              {b.location} · Scheduled for {date(b.scheduledAt, true)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-ghost h-9"
              onClick={() => setRescheduleOpen(true)}
              disabled={b.status === 'CANCELLED'}
            >
              Reschedule
            </button>
            <button
              className="btn-ghost h-9 text-red-600 disabled:opacity-50"
              onClick={() => setCancelOpen(true)}
              disabled={b.status === 'CANCELLED'}
            >
              {b.status === 'CANCELLED' ? 'Cancelled' : 'Cancel Booking'}
            </button>
          </div>
        </div>
      </Card>

      <RescheduleBookingModal
        booking={b}
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        onRescheduled={reload}
      />

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancelBooking}
        title="Cancel Booking"
        message={`Cancel booking ${b.displayId}? The customer's slot will be released.`}
        confirmLabel="Cancel Booking"
        danger
        busy={busy}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <h2 className="mb-2 font-semibold text-slate-900">
              Booking Meeting Logistics
            </h2>
            <Row label="Service Type" value={titleCase(b.serviceType)} />
            <Row label="Scheduled Date" value={date(b.scheduledAt)} />
            <Row label="Meeting Time Slot" value={b.meetingTimeSlot} />
            <Row label="Duration" value={duration(b.durationMinutes)} />
            <Row label="Meeting Location" value={b.location} />
            <Row label="Client Special Notes" value={b.clientNotes} />
          </Card>

          <Card>
            <h2 className="mb-2 font-semibold text-slate-900">
              Payment Ledger Breakdown
            </h2>
            <Row label="Billing Amount" value={money(b.amount)} />
            <Row label="Payment Status" value={<StatusBadge value={b.paymentStatus} />} />
            <Row label="Invoice Link" value={b.invoiceRef ? `#${b.invoiceRef}` : '—'} />
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 font-semibold text-slate-900">Customer Overview</h2>
            {b.user && (
              <Link
                to={`/users/${b.user.id}`}
                className="flex items-center gap-3 rounded-lg p-1 hover:bg-slate-50"
              >
                <Avatar name={b.user.fullName} size={44} />
                <div>
                  <p className="font-medium text-slate-800">{b.user.fullName}</p>
                  <p className="text-xs text-slate-400">{b.user.email}</p>
                </div>
              </Link>
            )}
            {b.customerCompletedBookings != null && (
              <Badge tone="slate">
                {b.customerCompletedBookings} bookings completed
              </Badge>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold text-slate-900">Booking Lifecycle Logs</h2>
            <div className="space-y-4">
              {b.events?.map((e) => (
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
