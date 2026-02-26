import { useState } from 'react';
import { createReading } from '../api';

export default function ReadingForm({ onSaved }) {
  const now = new Date();
  const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const [form, setForm] = useState({
    recorded_at: localISO,
    systolic: '',
    diastolic: '',
    pulse: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const sys = Number(form.systolic);
    const dia = Number(form.diastolic);

    if (!form.recorded_at || !sys || !dia) {
      setError('Date/time, systolic, and diastolic are required.');
      return;
    }
    if (sys < 50 || sys > 250) {
      setError('Systolic must be between 50 and 250 mmHg.');
      return;
    }
    if (dia < 30 || dia > 200) {
      setError('Diastolic must be between 30 and 200 mmHg.');
      return;
    }
    if (dia >= sys) {
      setError('Diastolic must be less than systolic.');
      return;
    }

    const pul = form.pulse ? Number(form.pulse) : null;
    if (pul !== null && (pul < 30 || pul > 220)) {
      setError('Pulse must be between 30 and 220 bpm.');
      return;
    }

    setSaving(true);
    try {
      await createReading({
        recorded_at: form.recorded_at,
        systolic: sys,
        diastolic: dia,
        pulse: pul,
        notes: form.notes,
      });
      // reset form
      const n = new Date();
      const iso = new Date(n.getTime() - n.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setForm({ recorded_at: iso, systolic: '', diastolic: '', pulse: '', notes: '' });
      onSaved();
    } catch {
      setError('Failed to save reading. Is the server running?');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="reading-form" onSubmit={handleSubmit}>
      <h2>➕ New Reading</h2>

      {error && <p className="form-error">{error}</p>}

      <div className="form-grid">
        <label>
          Date &amp; Time
          <input
            type="datetime-local"
            name="recorded_at"
            value={form.recorded_at}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Systolic (mmHg)
          <input
            type="number"
            name="systolic"
            placeholder="e.g. 120"
            value={form.systolic}
            onChange={handleChange}
            min="50"
            max="250"
            required
          />
        </label>

        <label>
          Diastolic (mmHg)
          <input
            type="number"
            name="diastolic"
            placeholder="e.g. 80"
            value={form.diastolic}
            onChange={handleChange}
            min="30"
            max="200"
            required
          />
        </label>

        <label>
          Pulse (bpm)
          <input
            type="number"
            name="pulse"
            placeholder="e.g. 72"
            value={form.pulse}
            onChange={handleChange}
            min="30"
            max="220"
          />
        </label>

        <label>
          Notes (optional)
          <input
            type="text"
            name="notes"
            placeholder="e.g. after exercise"
            value={form.notes}
            onChange={handleChange}
          />
        </label>
      </div>

      <button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save Reading'}
      </button>
    </form>
  );
}

