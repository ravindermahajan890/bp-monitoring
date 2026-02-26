import { useMemo, useState } from 'react';

// Strip Z / timezone offset so the browser reads the timestamp as the
// exact wall-clock time the user entered (no UTC shift).
function parseLocal(str) {
  return new Date(String(str).replace('T', ' ').replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, ''));
}

function getTimeOfDay(date) {
  const hour = date.getHours();
  if (hour >= 18 || hour < 2) return 'Night';   // 18:00 – 01:59
  if (hour < 12) return 'Morning';               // 02:00 – 11:59
  return 'Evening';                              // 12:00 – 17:59
}

function classifyBP(systolic, diastolic) {
  if (systolic < 120 && diastolic < 80) return 'Normal';
  if (systolic < 130 && diastolic < 80) return 'Elevated';
  if (systolic < 140 || diastolic < 90) return 'High – Stage 1';
  return 'High – Stage 2';
}

function avg(arr) {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((s, v) => s + Number(v), 0) / arr.length);
}

function minMax(arr) {
  if (!arr.length) return { min: 0, max: 0 };
  return { min: Math.min(...arr), max: Math.max(...arr) };
}

const DATE_RANGES = [
  { label: '1 Day',   value: 1  },
  { label: '7 Days',  value: 7  },
  { label: '15 Days', value: 15 },
  { label: '30 Days', value: 30 },
];

const METRIC_FILTERS = ['All', 'Systolic', 'Diastolic', 'Pulse'];

const METRIC_META = {
  Systolic:  { emoji: '🔴', unit: 'mmHg', color: '#ef4444', normalMax: 120 },
  Diastolic: { emoji: '🔵', unit: 'mmHg', color: '#3b82f6', normalMax: 80  },
  Pulse:     { emoji: '💜', unit: 'bpm',  color: '#a855f7', normalMax: 100 },
};

const TIME_FILTERS = [
  { label: 'All',     value: 'All'     },
  { label: '🌅 Morning', value: 'Morning' },
  { label: '☀️ Evening', value: 'Evening' },
  { label: '🌙 Night',   value: 'Night'   },
];

export default function BPInsights({ readings }) {
  const [activeMetric, setActiveMetric] = useState('All');
  const [dateRange, setDateRange]       = useState(7);
  const [timePeriod, setTimePeriod]     = useState('All');

  const filteredReadings = useMemo(() => {
    const now    = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - dateRange);
    return readings.filter((r) => parseLocal(r.recorded_at) >= cutoff);
  }, [readings, dateRange]);

  const stats = useMemo(() => {
    if (!filteredReadings.length) return null;

    const groups      = { Morning: [], Evening: [], Night: [] };
    const dayMetrics  = {};

    const sorted = [...filteredReadings].sort(
      (a, b) => parseLocal(a.recorded_at) - parseLocal(b.recorded_at)
    );

    sorted.forEach((r) => {
      const d      = parseLocal(r.recorded_at);
      const period = getTimeOfDay(d);
      groups[period].push(r);

      const dayKey = d.toLocaleDateString('en-CA');
      if (!dayMetrics[dayKey]) dayMetrics[dayKey] = { systolic: [], diastolic: [], pulse: [] };
      dayMetrics[dayKey].systolic.push(r.systolic);
      dayMetrics[dayKey].diastolic.push(r.diastolic);
      if (r.pulse) dayMetrics[dayKey].pulse.push(r.pulse);
    });

    const allSys   = sorted.map((r) => r.systolic);
    const allDia   = sorted.map((r) => r.diastolic);
    const allPulse = sorted.filter((r) => r.pulse).map((r) => r.pulse);

    const periodStats = {};
    for (const [period, items] of Object.entries(groups)) {
      if (!items.length) { periodStats[period] = null; continue; }
      periodStats[period] = {
        items: [...items].sort((a, b) => parseLocal(b.recorded_at) - parseLocal(a.recorded_at)),
      };
    }

    return {
      total: filteredReadings.length,
      totalDays: Object.keys(dayMetrics).length,
      periodStats,
      overall: {
        systolic:  { avg: avg(allSys),   ...minMax(allSys)   },
        diastolic: { avg: avg(allDia),   ...minMax(allDia)   },
        pulse:     allPulse.length ? { avg: avg(allPulse), ...minMax(allPulse) } : null,
      },
    };
  }, [filteredReadings]);

  if (!stats || stats.total < 2) return null;

  const periodMeta = {
    Morning: { emoji: '🌅', hours: '2:00 AM – 11:59 AM' },
    Evening: { emoji: '☀️', hours: '12:00 PM – 5:59 PM' },
    Night:   { emoji: '🌙', hours: '6:00 PM – 1:59 AM'  },
  };

  return (
    <div className="insights-wrapper">
      <div className="insights-header">
        <h2>📊 Insights &amp; Trends</h2>
      </div>

      <p className="insights-subtitle">
        Showing data for the <strong>last {dateRange} day{dateRange > 1 ? 's' : ''}</strong> —{' '}
        <strong>{stats.total} reading{stats.total !== 1 ? 's' : ''}</strong> across{' '}
        <strong>{stats.totalDays} day{stats.totalDays !== 1 ? 's' : ''}</strong>.
        Overall average:{' '}
        <strong>{stats.overall.systolic.avg}/{stats.overall.diastolic.avg} mmHg</strong>
        {stats.overall.pulse && <>, pulse <strong>{stats.overall.pulse.avg} bpm</strong></>}.
      </p>

      <div className="filter-toolbar">
        <div className="filter-group">
          <span className="filter-group-label">Period</span>
          <div className="filter-pills">
            {DATE_RANGES.map((range) => (
              <button
                key={range.value}
                className={`filter-pill ${dateRange === range.value ? 'active' : ''}`}
                onClick={() => setDateRange(range.value)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-divider" />

        <div className="filter-group">
          <span className="filter-group-label">Metric</span>
          <div className="filter-pills">
            {METRIC_FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-pill ${activeMetric === f ? 'active' : ''}`}
                onClick={() => setActiveMetric(f)}
              >
                {f === 'Systolic'  && '🔴 '}
                {f === 'Diastolic' && '🔵 '}
                {f === 'Pulse'     && '💜 '}
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-divider" />

        <div className="filter-group">
          <span className="filter-group-label">Time of Day</span>
          <div className="filter-pills">
            {TIME_FILTERS.map((f) => (
              <button
                key={f.value}
                className={`filter-pill ${timePeriod === f.value ? 'active' : ''}`}
                onClick={() => setTimePeriod(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="insights-grid">
        {/* ── Readings by Time of Day ── */}
        <div className="insights-section insights-section-full">
          <h3>🕐 Readings by Time of Day</h3>
          <p className="section-desc">All readings in the selected period, grouped by time of day.</p>
          {['Morning', 'Evening', 'Night']
            .filter((p) => timePeriod === 'All' || timePeriod === p)
            .map((period) => {
            const meta  = periodMeta[period];
            const items = stats.periodStats[period]?.items;
            if (!items?.length) return null;
            return (
              <div key={period} className="period-log">
                <div className="period-log-heading">
                  {meta.emoji} {period} <span>{meta.hours}</span>
                </div>
                <table className="reading-log-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      {(activeMetric === 'All' || activeMetric === 'Systolic')  && <th>Systolic</th>}
                      {(activeMetric === 'All' || activeMetric === 'Diastolic') && <th>Diastolic</th>}
                      {(activeMetric === 'All' || activeMetric === 'Pulse')     && <th>Pulse</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r, i) => {
                      const d      = parseLocal(r.recorded_at);
                      const cat    = classifyBP(r.systolic, r.diastolic);
                      const isHigh = cat === 'High – Stage 1' || cat === 'High – Stage 2';
                      return (
                        <tr key={i} className={isHigh ? 'row-high' : ''}>
                          <td>{d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td>{d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</td>
                          {(activeMetric === 'All' || activeMetric === 'Systolic')  && <td className={r.systolic  >= 130 ? 'val-high' : ''}>{r.systolic}</td>}
                          {(activeMetric === 'All' || activeMetric === 'Diastolic') && <td className={r.diastolic >= 90  ? 'val-high' : ''}>{r.diastolic}</td>}
                          {(activeMetric === 'All' || activeMetric === 'Pulse')     && <td>{r.pulse ?? '—'}</td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

