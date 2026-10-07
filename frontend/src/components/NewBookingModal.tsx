import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal, Field } from './ui';
import { api } from '../lib/api';
import { useApi } from '../lib/useApi';
import { titleCase } from '../lib/format';
import type { Paginated, User } from '../lib/types';

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

export function NewBookingModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { data: users } = useApi<Paginated<User>>(
    open ? '/users' : null,
    { limit: 100, sortBy: 'fullName', sortOrder: 'asc' },
  );
  const [form, setForm] = useState({
    userId: '',
    serviceType: 'BUSINESS_CONSULTATION',
    scheduledAt: '',
    durationMinutes: '60',
    amount: '',
    status: 'PENDING',
    location: 'Virtual - Zoom Link Provided',
    clientNotes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/bookings', {
        userId: form.userId,
        serviceType: form.serviceType,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: Number(form.durationMinutes),
        amount: Number(form.amount),
        status: form.status,
        location: form.location || undefined,
        clientNotes: form.clientNotes || undefined,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to create booking');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Booking">
      <form onSubmit={save} className="space-y-3">
        <Field label="Customer">
          <select
            className="input"
            value={form.userId}
            onChange={(e) => set('userId', e.target.value)}
            required
          >
            <option value="">Select a customer…</option>
            {users?.data.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} ({u.displayId})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Service Type">
          <select
            className="input"
            value={form.serviceType}
            onChange={(e) => set('serviceType', e.target.value)}
          >
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date & Time">
            <input
              type="datetime-local"
              className="input"
              value={form.scheduledAt}
              onChange={(e) => set('scheduledAt', e.target.value)}
              required
            />
          </Field>
          <Field label="Duration">
            <select
              className="input"
              value={form.durationMinutes}
              onChange={(e) => set('durationMinutes', e.target.value)}
            >
              <option value="60">1.0 hr</option>
              <option value="90">1.5 hrs</option>
              <option value="120">2.0 hrs</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount ($)">
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              required
            />
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </Field>
        </div>
        <Field label="Location">
          <input
            className="input"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
          />
        </Field>
        <Field label="Client Notes">
          <input
            className="input"
            value={form.clientNotes}
            onChange={(e) => set('clientNotes', e.target.value)}
          />
        </Field>

        {error && (
          <p className="rounded-lg bg-error-light px-3 py-2 text-[13px] text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost h-9" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary h-9" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Create Booking
          </button>
        </div>
      </form>
    </Modal>
  );
}
