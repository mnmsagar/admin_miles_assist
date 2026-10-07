import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal, Field } from './ui';
import { api } from '../lib/api';
import type { User } from '../lib/types';

export function EditUserModal({
  user,
  open,
  onClose,
  onSaved,
}: {
  user: User;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? '',
    mailingAddress: user.mailingAddress ?? '',
    role: user.role,
    status: user.status,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.patch(`/users/${user.id}`, {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        mailingAddress: form.mailingAddress || undefined,
        role: form.role,
        status: form.status,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile">
      <form onSubmit={save} className="space-y-3">
        <Field label="Full Name">
          <input
            className="input"
            value={form.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            required
          />
        </Field>
        <Field label="Email Address">
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            required
          />
        </Field>
        <Field label="Phone Number">
          <input
            className="input"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
        </Field>
        <Field label="Mailing Address">
          <input
            className="input"
            value={form.mailingAddress}
            onChange={(e) => set('mailingAddress', e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role">
            <select
              className="input"
              value={form.role}
              onChange={(e) => set('role', e.target.value as typeof form.role)}
            >
              <option value="ADMIN">Admin</option>
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={form.status}
              onChange={(e) => set('status', e.target.value as typeof form.status)}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </Field>
        </div>

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
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
