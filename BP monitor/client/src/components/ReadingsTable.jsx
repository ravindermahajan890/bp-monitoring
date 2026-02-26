import { deleteReading } from '../api';

function classifyBP(systolic, diastolic) {
  if (systolic < 120 && diastolic < 80) return { label: 'Normal', color: '#22c55e' };
  if (systolic < 130 && diastolic < 80) return { label: 'Elevated', color: '#eab308' };
  if (systolic < 140 || diastolic < 90) return { label: 'High – Stage 1', color: '#f97316' };
  if (systolic >= 140 || diastolic >= 90) return { label: 'High – Stage 2', color: '#ef4444' };
  return { label: '—', color: '#888' };
}

function sysColor(v) {
  if (v < 120) return '#22c55e';   // green – normal
  if (v < 130) return '#eab308';   // amber – elevated
  if (v < 140) return '#f97316';   // orange – high stage 1
  return '#ef4444';                // red – high stage 2
}

function diaColor(v) {
  if (v < 80) return '#22c55e';    // green – normal
  if (v < 90) return '#f97316';    // orange – high stage 1
  return '#ef4444';                // red – high stage 2
}

function pulseColor(v) {
  if (v >= 60 && v <= 100) return '#22c55e';  // green – normal resting
  if (v >= 50 && v <= 110) return '#eab308';  // amber – borderline
  return '#ef4444';                           // red – outside range
}

export default function ReadingsTable({ readings, onDeleted }) {
  if (!readings.length) {
    return <p className="empty-msg">No readings yet. Add your first one above!</p>;
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reading?')) return;
    await deleteReading(id);
    onDeleted();
  };

  return (
    <div className="table-wrapper">
      <h2>📋 Reading History</h2>

      {/* Desktop table */}
      <table className="readings-table-desktop">
        <thead>
          <tr>
            <th>Date &amp; Time</th>
            <th>Systolic</th>
            <th>Diastolic</th>
            <th>Pulse</th>
            <th>Category</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r) => {
            const bp = classifyBP(r.systolic, r.diastolic);
            return (
              <tr key={r.id}>
                <td>
                  {new Date(r.recorded_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}{' '}
                  {new Date(r.recorded_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td>
                  <span className="val-cell" style={{ background: sysColor(r.systolic) }}>
                    {r.systolic}
                  </span>
                </td>
                <td>
                  <span className="val-cell" style={{ background: diaColor(r.diastolic) }}>
                    {r.diastolic}
                  </span>
                </td>
                <td>
                  {r.pulse
                    ? <span className="val-cell" style={{ background: pulseColor(r.pulse) }}>{r.pulse}</span>
                    : '—'}
                </td>
                <td>
                  <span className="bp-badge" style={{ background: bp.color }}>
                    {bp.label}
                  </span>
                </td>
                <td>{r.notes || '—'}</td>
                <td>
                  <button className="btn-delete" onClick={() => handleDelete(r.id)}>
                    🗑
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="readings-cards-mobile">
        {readings.map((r) => {
          const bp = classifyBP(r.systolic, r.diastolic);
          return (
            <div key={r.id} className="reading-card">
              <div className="reading-card-top">
                <span className="reading-card-date">
                  {new Date(r.recorded_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}{' '}
                  {new Date(r.recorded_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="bp-badge" style={{ background: bp.color }}>
                  {bp.label}
                </span>
              </div>
              <div className="reading-card-values">
                <div className="reading-card-val">
                  <span className="reading-card-label">SYS</span>
                  <span className="val-cell" style={{ background: sysColor(r.systolic) }}>
                    {r.systolic}
                  </span>
                </div>
                <div className="reading-card-val">
                  <span className="reading-card-label">DIA</span>
                  <span className="val-cell" style={{ background: diaColor(r.diastolic) }}>
                    {r.diastolic}
                  </span>
                </div>
                <div className="reading-card-val">
                  <span className="reading-card-label">PULSE</span>
                  {r.pulse
                    ? <span className="val-cell" style={{ background: pulseColor(r.pulse) }}>{r.pulse}</span>
                    : <span className="reading-card-na">—</span>}
                </div>
              </div>
              {r.notes && <p className="reading-card-notes">{r.notes}</p>}
              <button className="btn-delete reading-card-delete" onClick={() => handleDelete(r.id)}>
                🗑 Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

