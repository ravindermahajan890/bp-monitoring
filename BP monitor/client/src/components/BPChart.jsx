import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

function getTimeOfDay(date) {
  const hour = date.getHours();
  if (hour >= 18 || hour < 2) return 'Night';
  if (hour < 12) return 'Morning';
  return 'Evening';
}

function parseLocal(str) {
  return new Date(String(str).replace('T', ' ').replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, ''));
}

const FILTERS = ['All', 'Morning', 'Evening', 'Night'];

export default function BPChart({ readings }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [hiddenLines, setHiddenLines] = useState(new Set());

  const toggleLine = (dataKey) => {
    setHiddenLines((prev) => {
      const next = new Set(prev);
      if (next.has(dataKey)) {
        next.delete(dataKey);
      } else {
        next.add(dataKey);
      }
      return next;
    });
  };

  if (readings.length < 2) {
    return <p className="empty-msg">Add at least 2 readings to see the chart.</p>;
  }

  // Filter readings by time of day
  const filtered = activeFilter === 'All'
    ? readings
    : readings.filter((r) => getTimeOfDay(parseLocal(r.recorded_at)) === activeFilter);

  // Sort oldest → newest for the chart
  const sorted = [...filtered]
    .sort((a, b) => parseLocal(a.recorded_at) - parseLocal(b.recorded_at))
    .map((r) => {
      const d = parseLocal(r.recorded_at);
      return {
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        systolic: r.systolic,
        diastolic: r.diastolic,
        pulse: r.pulse || null,
      };
    });

  // Generate Y-axis ticks every 10 from 40 to 200
  const yTicks = Array.from({ length: 17 }, (_, i) => 40 + i * 10);

  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <h2>📈 Blood Pressure &amp; Pulse Trend</h2>
        <div className="filter-pills">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-pill ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f === 'Morning' && '🌅 '}
              {f === 'Evening' && '☀️ '}
              {f === 'Night' && '🌙 '}
              {f}
            </button>
          ))}
        </div>
      </div>

      {sorted.length < 2 ? (
        <p className="empty-msg">Not enough {activeFilter.toLowerCase()} readings to chart. Try a different filter.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={sorted} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                domain={[40, 200]}
                ticks={yTicks}
                interval={0}
                allowDataOverflow
                tick={{ fontSize: 10 }}
                label={{ value: 'mmHg / bpm', angle: -90, position: 'insideLeft', fontSize: 12 }}
              />
              <Tooltip
                formatter={(value, name) => {
                  const unit = name === 'Pulse' ? 'bpm' : 'mmHg';
                  return [`${value} ${unit}`, name];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length) {
                    return `${label} (${payload[0].payload.time})`;
                  }
                  return label;
                }}
              />
              <Legend
                onClick={(e) => toggleLine(e.dataKey)}
                formatter={(value, entry) => (
                  <span style={{
                    color: hiddenLines.has(entry.dataKey) ? '#ccc' : entry.color,
                    cursor: 'pointer',
                    textDecoration: hiddenLines.has(entry.dataKey) ? 'line-through' : 'none',
                  }}>
                    {value}
                  </span>
                )}
              />
              {/* Normal threshold lines */}
              <ReferenceLine y={120} stroke="#22c55e" strokeDasharray="6 3" label={{ value: '120', position: 'right', fontSize: 11 }} />
              <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="6 3" label={{ value: '80', position: 'right', fontSize: 11 }} />

              <Line
                type="monotone"
                dataKey="systolic"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Systolic"
                hide={hiddenLines.has('systolic')}
              />
              <Line
                type="monotone"
                dataKey="diastolic"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Diastolic"
                hide={hiddenLines.has('diastolic')}
              />
              <Line
                type="monotone"
                dataKey="pulse"
                stroke="#a855f7"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Pulse"
                connectNulls
                hide={hiddenLines.has('pulse')}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="chart-hint">
            Green dashed lines show normal BP thresholds (120 / 80 mmHg). Purple dashed line shows pulse.
          </p>
        </>
      )}
    </div>
  );
}

