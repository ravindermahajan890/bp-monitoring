import { useMemo, useState } from 'react';

function getTimeOfDay(date) {
  const hour = date.getHours();
  if (hour >= 18 || hour < 2) return 'Night';    // 18:00 – 01:59
  if (hour < 12) return 'Morning';                // 02:00 – 11:59
  return 'Evening';                               // 12:00 – 17:59
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

function trendInfo(values) {
  if (values.length < 4) return null;
  const half = Math.floor(values.length / 2);
  const older = avg(values.slice(0, half));
  const recent = avg(values.slice(half));
  const diff = recent - older;
  return { older, recent, diff };
}

const METRIC_FILTERS = ['All', 'Systolic', 'Diastolic', 'Pulse'];

const METRIC_META = {
  Systolic: {
    emoji: '🔴',
    unit: 'mmHg',
    color: '#ef4444',
    normalMax: 120,
    what: 'Systolic pressure (the top number)',
    explanation: `This is the pressure in your arteries when your heart beats and pushes blood out. It's the higher of the two numbers in a BP reading (e.g. the 120 in 120/80).`,
    normalRange: 'Below 120 mmHg is considered normal.',
    concern: 'Consistently above 130 mmHg may indicate hypertension.',
  },
  Diastolic: {
    emoji: '🔵',
    unit: 'mmHg',
    color: '#3b82f6',
    normalMax: 80,
    what: 'Diastolic pressure (the bottom number)',
    explanation: `This is the pressure in your arteries when your heart rests between beats. It's the lower number (e.g. the 80 in 120/80).`,
    normalRange: 'Below 80 mmHg is considered normal.',
    concern: 'Consistently above 90 mmHg may indicate hypertension.',
  },
  Pulse: {
    emoji: '💜',
    unit: 'bpm',
    color: '#a855f7',
    normalMax: 100,
    what: 'Pulse / Heart Rate',
    explanation: 'This is how many times your heart beats per minute. It reflects your cardiovascular fitness and current activity level.',
    normalRange: '60–100 bpm at rest is considered normal for adults.',
    concern: 'Consistently above 100 bpm at rest (tachycardia) or below 60 bpm (bradycardia, unless athletic) may need attention.',
  },
};

function DaysSummaryCard({ stats, activeMetric, catMeta, readings }) {
  let daysNormal, daysAbove, totalDays, description;

  if (activeMetric === 'All') {
    daysNormal = stats.daysNormal;
    daysAbove = stats.daysAbove;
    totalDays = stats.totalDays;
    description = 'A day counts as "normal" only if every reading that day was below 120/80 mmHg (combined systolic & diastolic).';
  } else {
    const key = activeMetric.toLowerCase();
    const threshold = METRIC_META[activeMetric].normalMax;
    const unit = METRIC_META[activeMetric].unit;
    let normal = 0;
    let above = 0;
    const days = Object.entries(stats.dayMetrics);
    days.forEach(([, metrics]) => {
      const values = metrics[key];
      if (!values || !values.length) return;
      const allBelow = values.every((v) => v < threshold);
      if (allBelow) normal++;
      else above++;
    });
    daysNormal = normal;
    daysAbove = above;
    totalDays = normal + above;
    description = `A day counts as "normal" for ${activeMetric.toLowerCase()} if every reading that day was below ${threshold} ${unit}.`;
  }

  if (totalDays === 0) {
    return (
      <div className="insights-section">
        <h3>📅 How Many Days Were Normal?</h3>
        <p className="section-desc">No data available for this metric yet.</p>
      </div>
    );
  }

  const normalPct = Math.round((daysNormal / totalDays) * 100);
  const abovePct = 100 - normalPct;

  return (
    <div className="insights-section">
      <h3>📅 How Many Days Were Normal?</h3>
      <p className="section-desc">{description}</p>
      <div className="days-summary">
        <div className="days-bar">
          {daysNormal > 0 && (
            <div className="days-bar-segment normal" style={{ flex: daysNormal }}>
              {normalPct}%
            </div>
          )}
          {daysAbove > 0 && (
            <div className="days-bar-segment above" style={{ flex: daysAbove }}>
              {abovePct}%
            </div>
          )}
        </div>
        <div className="days-legend">
          <span className="days-legend-item">
            <span className="dot dot-normal"></span>
            <strong>{daysNormal}</strong> day{daysNormal !== 1 ? 's' : ''} all normal
          </span>
          <span className="days-legend-item">
            <span className="dot dot-above"></span>
            <strong>{daysAbove}</strong> day{daysAbove !== 1 ? 's' : ''} above normal
          </span>
        </div>
      </div>

      {activeMetric === 'All' && (
        <>
          <h4 className="sub-heading">Reading Breakdown by Category</h4>
          <div className="category-list">
            {Object.entries(stats.categories).map(([cat, count]) => {
              const meta = catMeta[cat];
              return (
                <div key={cat} className="category-row">
                  <span className="cat-icon">{meta.icon}</span>
                  <div className="cat-info">
                    <span className="cat-name">{cat}</span>
                    <span className="cat-range">{meta.desc}</span>
                  </div>
                  <span className="cat-count" style={{ background: meta.color }}>{count}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeMetric !== 'All' && (
        <>
          <h4 className="sub-heading">{activeMetric} Reading Breakdown</h4>
          <div className="category-list">
            <div className="category-row">
              <span className="cat-icon">✅</span>
              <div className="cat-info">
                <span className="cat-name">Normal</span>
                <span className="cat-range">Below {METRIC_META[activeMetric].normalMax} {METRIC_META[activeMetric].unit}</span>
              </div>
              <span className="cat-count" style={{ background: '#22c55e' }}>
                {readings.filter((r) => {
                  const v = activeMetric === 'Pulse' ? r.pulse : r[activeMetric.toLowerCase()];
                  return v != null && v < METRIC_META[activeMetric].normalMax;
                }).length}
              </span>
            </div>
            <div className="category-row">
              <span className="cat-icon">⚠️</span>
              <div className="cat-info">
                <span className="cat-name">Above Normal</span>
                <span className="cat-range">{METRIC_META[activeMetric].normalMax}+ {METRIC_META[activeMetric].unit}</span>
              </div>
              <span className="cat-count" style={{ background: '#ef4444' }}>
                {readings.filter((r) => {
                  const v = activeMetric === 'Pulse' ? r.pulse : r[activeMetric.toLowerCase()];
                  return v != null && v >= METRIC_META[activeMetric].normalMax;
                }).length}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function BPInsights({ readings }) {
  const [activeMetric, setActiveMetric] = useState('All');

  const stats = useMemo(() => {
    if (!readings.length) return null;

    const groups = { Morning: [], Evening: [], Night: [] };
    const categories = { 'Normal': 0, 'Elevated': 0, 'High – Stage 1': 0, 'High – Stage 2': 0 };
    const dayCategories = {};
    // Per-day per-metric tracking for filtered days
    const dayMetrics = {}; // { '2026-02-26': { systolic: [130], diastolic: [85], pulse: [72] } }

    const sorted = [...readings].sort(
      (a, b) => new Date(a.recorded_at) - new Date(b.recorded_at)
    );

    sorted.forEach((r) => {
      const d = new Date(r.recorded_at);
      groups[getTimeOfDay(d)].push(r);
      const cat = classifyBP(r.systolic, r.diastolic);
      categories[cat]++;
      const dayKey = d.toISOString().slice(0, 10);
      if (!dayCategories[dayKey]) dayCategories[dayKey] = new Set();
      dayCategories[dayKey].add(cat);
      if (!dayMetrics[dayKey]) dayMetrics[dayKey] = { systolic: [], diastolic: [], pulse: [] };
      dayMetrics[dayKey].systolic.push(r.systolic);
      dayMetrics[dayKey].diastolic.push(r.diastolic);
      if (r.pulse) dayMetrics[dayKey].pulse.push(r.pulse);
    });

    let daysNormal = 0;
    let daysAbove = 0;
    Object.values(dayCategories).forEach((cats) => {
      if ([...cats].some((c) => c !== 'Normal')) daysAbove++;
      else daysNormal++;
    });

    const allSys = sorted.map((r) => r.systolic);
    const allDia = sorted.map((r) => r.diastolic);
    const allPulse = sorted.filter((r) => r.pulse).map((r) => r.pulse);

    // Per-period stats
    const periodStats = {};
    for (const [period, items] of Object.entries(groups)) {
      if (!items.length) { periodStats[period] = null; continue; }
      const sysList = items.map((r) => r.systolic);
      const diaList = items.map((r) => r.diastolic);
      const pulseList = items.filter((r) => r.pulse).map((r) => r.pulse);
      periodStats[period] = {
        count: items.length,
        systolic:  { avg: avg(sysList),   ...minMax(sysList),   trend: trendInfo(sysList) },
        diastolic: { avg: avg(diaList),   ...minMax(diaList),   trend: trendInfo(diaList) },
        pulse:     pulseList.length
          ? { avg: avg(pulseList), ...minMax(pulseList), trend: trendInfo(pulseList) }
          : null,
      };
    }

    return {
      total: readings.length,
      totalDays: Object.keys(dayCategories).length,
      daysNormal,
      daysAbove,
      categories,
      dayMetrics,
      periodStats,
      overall: {
        systolic:  { avg: avg(allSys),   ...minMax(allSys),   trend: trendInfo(allSys) },
        diastolic: { avg: avg(allDia),   ...minMax(allDia),   trend: trendInfo(allDia) },
        pulse:     allPulse.length
          ? { avg: avg(allPulse), ...minMax(allPulse), trend: trendInfo(allPulse) }
          : null,
      },
    };
  }, [readings]);

  if (!stats || stats.total < 2) return null;

  const periodMeta = {
    Morning: { emoji: '🌅', hours: '2:00 AM – 11:59 AM' },
    Evening: { emoji: '☀️', hours: '12:00 PM – 5:59 PM' },
    Night:   { emoji: '🌙', hours: '6:00 PM – 1:59 AM' },
  };

  const catMeta = {
    'Normal':          { color: '#22c55e', icon: '✅', desc: 'Below 120/80 mmHg' },
    'Elevated':        { color: '#eab308', icon: '⚡', desc: 'Systolic 120–129, Diastolic <80' },
    'High – Stage 1':  { color: '#f97316', icon: '⚠️', desc: 'Systolic 130–139 or Diastolic 80–89' },
    'High – Stage 2':  { color: '#ef4444', icon: '🔴', desc: 'Systolic ≥140 or Diastolic ≥90' },
  };

  function renderTrendBadge(trend, unit) {
    if (!trend) return <span className="trend-badge trend-na">Need 4+ readings to see trend</span>;
    const { older, recent, diff } = trend;
    let cls, icon, label;
    if (diff > 3) {
      cls = 'trend-up'; icon = '↑';
      label = `Increased by ${diff} ${unit}`;
    } else if (diff < -3) {
      cls = 'trend-down'; icon = '↓';
      label = `Decreased by ${Math.abs(diff)} ${unit}`;
    } else {
      cls = 'trend-stable'; icon = '→';
      label = 'Holding steady';
    }
    return (
      <div className={`trend-badge ${cls}`}>
        <span className="trend-arrow">{icon}</span>
        <span>{label}</span>
        <span className="trend-detail">Avg was {older}, now {recent} {unit}</span>
      </div>
    );
  }

  // Which metrics to show based on filter
  const metricsToShow = activeMetric === 'All'
    ? ['Systolic', 'Diastolic', 'Pulse']
    : [activeMetric];


  return (
    <div className="insights-wrapper">
      <h2>📊 Insights &amp; Trends</h2>
      <p className="insights-subtitle">
        Based on <strong>{stats.total} readings</strong> across <strong>{stats.totalDays} days</strong>.
        Your overall average is <strong>{stats.overall.systolic.avg}/{stats.overall.diastolic.avg} mmHg</strong>
        {stats.overall.pulse && <> with a pulse of <strong>{stats.overall.pulse.avg} bpm</strong></>}.
      </p>

      {/* ── Metric Filter Pills ─────────────────────── */}
      <div className="metric-filter-bar">
        <span className="metric-filter-label">Show insights for:</span>
        <div className="metric-pills">
          {METRIC_FILTERS.map((f) => (
            <button
              key={f}
              className={`metric-pill ${activeMetric === f ? 'active' : ''}`}
              onClick={() => setActiveMetric(f)}
            >
              {f === 'Systolic' && '🔴 '}
              {f === 'Diastolic' && '🔵 '}
              {f === 'Pulse' && '💜 '}
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="insights-grid">

        {/* ── Card 1: What Does This Mean? (Educational) ── */}
        {activeMetric !== 'All' && (
          <div className="insights-section insights-section-full">
            <h3>{METRIC_META[activeMetric].emoji} What is {activeMetric}?</h3>
            <div className="explainer-card">
              <p className="explainer-what">{METRIC_META[activeMetric].what}</p>
              <p className="explainer-body">{METRIC_META[activeMetric].explanation}</p>
              <div className="explainer-ranges">
                <div className="explainer-range ok">
                  <span className="explainer-range-icon">✅</span>
                  <span>{METRIC_META[activeMetric].normalRange}</span>
                </div>
                <div className="explainer-range warn">
                  <span className="explainer-range-icon">⚠️</span>
                  <span>{METRIC_META[activeMetric].concern}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeMetric === 'All' && (
          <div className="insights-section insights-section-full">
            <h3>🩺 Understanding Your Numbers</h3>
            <div className="explainer-grid">
              {['Systolic', 'Diastolic', 'Pulse'].map((key) => {
                const m = METRIC_META[key];
                return (
                  <div key={key} className="explainer-mini" onClick={() => setActiveMetric(key)} role="button" tabIndex={0}>
                    <span className="explainer-mini-emoji">{m.emoji}</span>
                    <div>
                      <strong>{m.what}</strong>
                      <p>{m.normalRange}</p>
                    </div>
                    <span className="explainer-mini-arrow">→</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Card 2: Trend Overview ──────────────────── */}
        <div className="insights-section">
          <h3>📉 {activeMetric === 'All' ? 'Are Your Numbers Improving?' : `${activeMetric} Trend`}</h3>
          <p className="section-desc">
            Comparing your earlier readings with recent ones to see which direction things are going.
          </p>
          <div className="trend-row">
            {metricsToShow.map((metric) => {
              const key = metric.toLowerCase();
              const data = stats.overall[key];
              if (!data) return null;
              const m = METRIC_META[metric];
              return (
                <div key={metric} className="trend-item">
                  <span className="trend-label">{m.emoji} {m.what}</span>
                  <div className="trend-stats-row">
                    <span className="trend-stat-mini">Avg <strong>{data.avg}</strong> {m.unit}</span>
                    <span className="trend-stat-mini">Low <strong>{data.min}</strong></span>
                    <span className="trend-stat-mini">High <strong>{data.max}</strong></span>
                  </div>
                  {renderTrendBadge(data.trend, m.unit)}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Card 3: Days Summary ──────────────────── */}
        <DaysSummaryCard
          stats={stats}
          activeMetric={activeMetric}
          catMeta={catMeta}
          readings={readings}
        />

        {/* ── Card 4: Time-of-Day ───────────────────── */}
        <div className="insights-section insights-section-full">
          <h3>🕐 Morning vs Evening vs Night</h3>
          <p className="section-desc">
            Blood pressure naturally fluctuates throughout the day. Compare your averages across time periods to spot patterns.
          </p>
          <div className="period-cards">
            {['Morning', 'Evening', 'Night'].map((period) => {
              const ps = stats.periodStats[period];
              const meta = periodMeta[period];
              return (
                <div key={period} className="period-card">
                  <div className="period-card-header">
                    <span className="period-emoji">{meta.emoji}</span>
                    <div>
                      <strong>{period}</strong>
                      <span className="period-hours">{meta.hours}</span>
                    </div>
                  </div>
                  {!ps ? (
                    <p className="period-empty">No readings recorded yet</p>
                  ) : (
                    <>
                      <p className="period-count">{ps.count} reading{ps.count !== 1 ? 's' : ''}</p>
                      <div className="period-metric-list">
                        {metricsToShow.map((metric) => {
                          const key = metric.toLowerCase();
                          const data = ps[key];
                          if (!data) return null;
                          const m = METRIC_META[metric];
                          const isWarn = data.avg >= m.normalMax;
                          return (
                            <div key={metric} className="period-metric-row">
                              <div className="period-metric-header">
                                <span>{m.emoji} {metric}</span>
                                <span className={`period-metric-avg ${isWarn ? 'warn' : 'ok'}`}>
                                  {data.avg} <small>{m.unit}</small>
                                </span>
                              </div>
                              <div className="period-metric-range">
                                Range: {data.min} – {data.max} {m.unit}
                              </div>
                              {renderTrendBadge(data.trend, m.unit)}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

