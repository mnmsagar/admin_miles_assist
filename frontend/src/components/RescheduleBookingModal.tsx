import { useState, useEffect } from 'react';
import { Loader2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Modal, Field } from './ui';
import { api } from '../lib/api';
import { titleCase } from '../lib/format';
import type { Booking } from '../lib/types';

function toLocalInput(dateInput: string | Date): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function addMinutesToLocal(localStr: string, minutes: number): string {
  const d = new Date(localStr);
  if (isNaN(d.getTime())) return '';
  d.setMinutes(d.getMinutes() + minutes);
  return toLocalInput(d);
}

function formatMeetingSlot(start: Date, end: Date): string {
  const formatTime = (d: Date) => {
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? '0' + minutes : String(minutes);
    return `${hours}:${minStr} ${ampm}`;
  };

  const startTimeStr = formatTime(start);
  const endTimeStr = formatTime(end);

  if (start.toDateString() !== end.toDateString()) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${months[start.getMonth()]} ${start.getDate()} ${startTimeStr} – ${months[end.getMonth()]} ${end.getDate()} ${endTimeStr}`;
  }

  return `${startTimeStr} - ${endTimeStr}`;
}

function formatDurationText(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`;
  const hrs = Math.floor(minutes / 60);
  const remMins = minutes % 60;
  if (remMins === 0) return `${hrs} ${hrs === 1 ? 'hour' : 'hours'}`;
  return `${hrs} hr ${remMins} mins (${minutes} mins)`;
}

export function RescheduleBookingModal({
  booking,
  open,
  onClose,
  onRescheduled,
}: {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
  onRescheduled: () => void;
}) {
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (booking && open) {
      const initialStart = toLocalInput(booking.scheduledAt);
      const initialDuration = booking.durationMinutes || 60;
      const initialEnd = addMinutesToLocal(initialStart, initialDuration);

      setStartDateTime(initialStart);
      setEndDateTime(initialEnd);
      setLocation(booking.location || '');
      setClientNotes(booking.clientNotes || '');
      setError('');
    }
  }, [booking, open]);

  if (!booking) return null;

  // Calculate duration and validate
  let diffMinutes = 0;
  let isValid = false;
  let validationMessage = '';
  let slotPreview = '';

  if (startDateTime && endDateTime) {
    const s = new Date(startDateTime);
    const e = new Date(endDateTime);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      diffMinutes = Math.round((e.getTime() - s.getTime()) / (60 * 1000));
      if (diffMinutes <= 0) {
        validationMessage = 'End date and time must be after start date and time';
      } else if (diffMinutes < 15) {
        validationMessage = 'Duration must be at least 15 minutes';
      } else {
        isValid = true;
        slotPreview = formatMeetingSlot(s, e);
      }
    }
  }

  function handleStartChange(newStart: string) {
    setStartDateTime(newStart);
    // If end date is now before start, or empty, push end date forward by previous duration or 60m
    const currentDuration = isValid && diffMinutes >= 15 ? diffMinutes : 60;
    if (!endDateTime || new Date(endDateTime) <= new Date(newStart)) {
      setEndDateTime(addMinutesToLocal(newStart, currentDuration));
    }
  }

  function applyPreset(minutes: number) {
    if (startDateTime) {
      setEndDateTime(addMinutesToLocal(startDateTime, minutes));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setBusy(true);
    setError('');

    try {
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      const calculatedDuration = Math.round(
        (end.getTime() - start.getTime()) / (60 * 1000),
      );
      const meetingSlot = formatMeetingSlot(start, end);

      await api.patch(`/bookings/${booking.id}`, {
        scheduledAt: start.toISOString(),
        durationMinutes: calculatedDuration,
        meetingTimeSlot: meetingSlot,
        location: location.trim() || undefined,
        clientNotes: clientNotes.trim() || undefined,
      });

      onRescheduled();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to reschedule booking');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Reschedule Booking ${booking.displayId}`}
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Current info banner */}
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <div className="flex items-center justify-between font-medium text-slate-800">
            <span>Customer: {booking.user?.fullName || 'N/A'}</span>
            <span className="text-brand-600">{titleCase(booking.serviceType)}</span>
          </div>
          <div className="mt-1 text-slate-500">
            Currently scheduled: {new Date(booking.scheduledAt).toLocaleString()} ({booking.durationMinutes} mins)
          </div>
        </div>

        {/* Start Date & Time */}
        <Field label="Start Date & Time">
          <div className="relative">
            <input
              type="datetime-local"
              className="input pr-9"
              value={startDateTime}
              onChange={(e) => handleStartChange(e.target.value)}
              required
            />
            <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          </div>
        </Field>

        {/* End Date & Time */}
        <Field label="End Date & Time">
          <div className="relative">
            <input
              type="datetime-local"
              className={`input pr-9 ${validationMessage ? 'border-red-500 focus:border-red-500' : ''}`}
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              required
            />
            <Clock className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          </div>
        </Field>

        {/* Quick Duration Presets */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
            <span>Quick Duration Presets:</span>
            {isValid && (
              <span className="font-semibold text-brand-600">
                Calculated: {formatDurationText(diffMinutes)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[30, 45, 60, 90, 120].map((mins) => (
              <button
                type="button"
                key={mins}
                onClick={() => applyPreset(mins)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  diffMinutes === mins && isValid
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mins < 60 ? `${mins}m` : mins === 60 ? '1h' : `${mins / 60}h`}
              </button>
            ))}
          </div>
        </div>

        {/* Validation or Slot preview */}
        {validationMessage ? (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
            <AlertCircle className="size-4 shrink-0 text-red-500" />
            <span>{validationMessage}</span>
          </div>
        ) : isValid && slotPreview ? (
          <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-2.5 text-xs text-brand-900">
            <span className="font-semibold">New Meeting Slot: </span>
            <span>{slotPreview}</span>
          </div>
        ) : null}

        {/* Meeting Location */}
        <Field label="Meeting Location / Link (optional)">
          <input
            className="input"
            placeholder="e.g. Virtual - Zoom Link Provided"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </Field>

        {/* Client Notes / Reason */}
        <Field label="Notes / Reschedule Reason (optional)">
          <input
            className="input"
            placeholder="e.g. Rescheduled per client request"
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
          />
        </Field>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className="btn-ghost h-9"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary h-9"
            disabled={busy || !isValid}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Confirm Reschedule
          </button>
        </div>
      </form>
    </Modal>
  );
}
