import React, { useMemo, useState } from 'react';

/**
 * Student 360 — a 360° performance view for a single student.
 *
 * This is a presentation-first dashboard. The analytics surfaced here
 * (day-wise questions, activity map, watch hours, streaks, mock trends)
 * are not yet served by a single API, so the page renders from a derived
 * `student` model. Wire each block to its real endpoint as they land;
 * the chart primitives below accept plain arrays and need no changes.
 */

// ── Mock / derived student model ──────────────────────────────────────────
const STUDENT = {
  name: 'Aarav Sharma',
  id: 'VP-2024-10897',
  avatar: 'https://i.pravatar.cc/160?img=12',
  email: 'aarav.sharma@example.com',
  phone: '+91 98765 43210',
  goal: 'IISER (IAT)',
  target: 89, // % readiness toward goal
  mentor: {
    name: 'Dr. Kavya Nair',
    role: 'Senior Mentor · Physics',
    avatar: 'https://i.pravatar.cc/80?img=47',
    since: 'Apr 2024',
  },
  batch: {
    name: 'IAT Crash 2025 — Alpha',
    mode: 'Offline',
    center: 'Kochi · MG Road',
    strength: 48,
    rank: 6,
    startedOn: '12 Mar 2024',
  },
  prepJourney: [
    { label: 'Foundation', done: true },
    { label: 'Concept Mastery', done: true },
    { label: 'Practice & PYQ', done: true },
    { label: 'Mock Phase', done: false, current: true },
    { label: 'Final Revision', done: false },
  ],
  stats: {
    questionsSolved: 8420,
    pyqSolved: 1240,
    watchHours: 312,
    currentStreak: 18,
    bestStreak: 41,
  },
  courses: [
    { name: 'IAT Complete Physics', progress: 92, type: 'course' },
    { name: 'Chemistry Masterclass', progress: 78, type: 'course' },
    { name: 'Biology Crash Course', progress: 64, type: 'course' },
    { name: 'Mathematics Foundations', progress: 88, type: 'course' },
    { name: 'IAT Grand Test Series', progress: 56, type: 'series' },
    { name: 'Weekly PYQ Series', progress: 71, type: 'series' },
  ],
  // Last 14 days of questions solved
  questionsDaily: [42, 55, 38, 61, 70, 24, 0, 48, 66, 72, 58, 80, 63, 45],
  // Offline classes attended vs scheduled (last 8 weeks)
  classesAttended: [
    { week: 'W1', attended: 5, total: 6 },
    { week: 'W2', attended: 6, total: 6 },
    { week: 'W3', attended: 4, total: 6 },
    { week: 'W4', attended: 6, total: 6 },
    { week: 'W5', attended: 5, total: 5 },
    { week: 'W6', attended: 6, total: 6 },
    { week: 'W7', attended: 3, total: 6 },
    { week: 'W8', attended: 6, total: 6 },
  ],
  // Mock test scores (last 7 tests), out of 100 percentile
  mockTests: [
    { name: 'Mock 01', percentile: 62 },
    { name: 'Mock 02', percentile: 68 },
    { name: 'Mock 03', percentile: 59 },
    { name: 'Mock 04', percentile: 74 },
    { name: 'Mock 05', percentile: 81 },
    { name: 'Mock 06', percentile: 78 },
    { name: 'Mock 07', percentile: 88 },
  ],
};

// 12 weeks × 7 days activity intensity (0–4). Deterministic pseudo-data.
const ACTIVITY = Array.from({ length: 12 }, (_, w) =>
  Array.from({ length: 7 }, (_, d) => {
    const v = (w * 7 + d * 3 + (w % 3) + (d % 4)) % 11;
    if (v > 8) return 4;
    if (v > 6) return 3;
    if (v > 4) return 2;
    if (v > 2) return 1;
    return 0;
  })
);

// ── Small primitives ───────────────────────────────────────────────────────
function Card({ title, icon, action, children, className = '', style }) {
  return (
    <section className={`s360-card ${className}`} style={style}>
      {(title || action) && (
        <header className="s360-card-head">
          <h3>
            {icon && <i className={`fa ${icon}`} />}
            {title}
          </h3>
          {action}
        </header>
      )}
      <div className="s360-card-body">{children}</div>
    </section>
  );
}

function Donut({ value, size = 150, stroke = 14, label, sub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <>
      <div className="s360-donut" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#s360grad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <defs>
            <linearGradient id="s360grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00a8cc" />
              <stop offset="100%" stopColor="#006073" />
            </linearGradient>
          </defs>
        </svg>
        <div className="s360-donut-center">
          <strong>{value}%</strong>
          {label && <span>{label}</span>}
        </div>
      </div>
      {sub && <p className="s360-donut-sub">{sub}</p>}
    </>
  );
}

function BarChart({ data, labels, height = 160, color = '#006073' }) {
  const max = Math.max(...data, 1);
  return (
    <div className="s360-bars" style={{ height }}>
      {data.map((v, i) => (
        <div className="s360-bar-col" key={i}>
          <div className="s360-bar-track">
            <div
              className="s360-bar-fill"
              style={{ height: `${(v / max) * 100}%`, background: color }}
              title={`${v}`}
            >
              <span className="s360-bar-val">{v}</span>
            </div>
          </div>
          {labels && <span className="s360-bar-label">{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}

function LineChart({ points, height = 180, width = 460 }) {
  const max = Math.max(...points.map((p) => p.percentile));
  const min = Math.min(...points.map((p) => p.percentile));
  const range = Math.max(max - min, 1);
  const pad = 28;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * innerW;
    const y = pad + innerH - ((p.percentile - min) / range) * innerH;
    return [x, y];
  });
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0]},${c[1]}`).join(' ');
  const area = `${path} L${coords[coords.length - 1][0]},${pad + innerH} L${coords[0][0]},${pad + innerH} Z`;
  return (
    <svg className="s360-line" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="s360area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00a8cc" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#00a8cc" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#s360area)" />
      <path d={path} fill="none" stroke="#006073" strokeWidth="2.5" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c[0]} cy={c[1]} r="4.5" fill="#fff" stroke="#006073" strokeWidth="2.5" />
          <text x={c[0]} y={c[1] - 12} textAnchor="middle" className="s360-line-val">
            {points[i].percentile}
          </text>
          <text x={c[0]} y={height - 8} textAnchor="middle" className="s360-line-label">
            {points[i].name.replace('Mock ', 'M')}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function Student360Page() {
  const s = STUDENT;
  const [range, setRange] = useState('14d');

  const avgMock = useMemo(
    () => Math.round(s.mockTests.reduce((a, b) => a + b.percentile, 0) / s.mockTests.length),
    [s.mockTests]
  );
  const lastMock = s.mockTests[s.mockTests.length - 1].percentile;
  const prevMock = s.mockTests[s.mockTests.length - 2].percentile;
  const mockDelta = lastMock - prevMock;

  const totalAttended = s.classesAttended.reduce((a, b) => a + b.attended, 0);
  const totalClasses = s.classesAttended.reduce((a, b) => a + b.total, 0);
  const attendancePct = Math.round((totalAttended / totalClasses) * 100);

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="student360-page">
      {/* Header */}
      <div className="s360-pagehead">
        <div className="s360-pagehead-title">
          <span className="s360-pagehead-icon"><i className="fa fa-user-circle-o" /></span>
          <div>
            <h2>Student 360</h2>
            <p>A complete view of the student's preparation, performance and engagement.</p>
          </div>
        </div>
        <button type="button" className="s360-btn-ghost">
          <i className="fa fa-download" /> Export report
        </button>
      </div>

      {/* Row 1 — Profile hero + headline stats */}
      <div className="s360-grid s360-grid-hero">
        <Card className="s360-hero">
          <div className="s360-hero-top">
            <img className="s360-avatar" src={s.avatar} alt={s.name} />
            <div className="s360-hero-id">
              <h3>{s.name}</h3>
              <span className="s360-id-chip">{s.id}</span>
              <ul className="s360-contact">
                <li><i className="fa fa-envelope-o" /> {s.email}</li>
                <li><i className="fa fa-phone" /> {s.phone}</li>
              </ul>
            </div>
            <div className="s360-goal-chip">
              <span>Goal</span>
              <strong>{s.goal}</strong>
            </div>
          </div>

          {/* Prep Journey */}
          <div className="s360-journey">
            <div className="s360-journey-head">
              <h4><i className="fa fa-flag-checkered" /> Prep Journey</h4>
              <span className="s360-journey-mentor">
                <img src={s.mentor.avatar} alt={s.mentor.name} />
                Mentor: <strong>{s.mentor.name}</strong> · {s.mentor.role}
              </span>
            </div>
            <ol className="s360-steps">
              {s.prepJourney.map((step, i) => (
                <li
                  key={i}
                  className={`s360-step${step.done ? ' done' : ''}${step.current ? ' current' : ''}`}
                >
                  <span className="s360-step-dot">
                    {step.done ? <i className="fa fa-check" /> : i + 1}
                  </span>
                  <span className="s360-step-label">{step.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </Card>

        {/* Overall progress toward goal */}
        <Card className="s360-progress-card">
          <Donut value={s.target} label={`close to`} sub={`Readiness toward ${s.goal}`} />
          <p className="s360-progress-note">
            Based on Prep Journey, mock trends &amp; syllabus coverage.
          </p>
        </Card>
      </div>

      {/* Row 2 — Headline KPI tiles */}
      <div className="s360-kpis">
        <KpiTile icon="fa-pencil-square-o" tint="#006073" value={s.stats.questionsSolved.toLocaleString()} label="Questions Solved" />
        <KpiTile icon="fa-history" tint="#7367f0" value={s.stats.pyqSolved.toLocaleString()} label="PYQ Solved" />
        <KpiTile icon="fa-play-circle-o" tint="#00a8cc" value={`${s.stats.watchHours} hrs`} label="Course Watch Hours" />
        <KpiTile icon="fa-fire" tint="#ff9f43" value={`${s.stats.currentStreak} days`} label="Current Streak" sub={`Best ${s.stats.bestStreak}d`} />
        <KpiTile icon="fa-line-chart" tint="#28c76f" value={`${avgMock}%`} label="Avg Mock Percentile" />
      </div>

      {/* Row 3 — Batch + Courses */}
      <div className="s360-grid s360-grid-2">
        <Card title="Batch Summary" icon="fa-layout-grid2 fa fa-cubes">
          <div className="s360-batch">
            <div className="s360-batch-name">
              <strong>{s.batch.name}</strong>
              <span className={`s360-mode-badge ${s.batch.mode.toLowerCase()}`}>{s.batch.mode}</span>
            </div>
            <div className="s360-batch-grid">
              <div><span>Center</span><strong>{s.batch.center}</strong></div>
              <div><span>Batch Strength</span><strong>{s.batch.strength}</strong></div>
              <div><span>Rank in Batch</span><strong>#{s.batch.rank}</strong></div>
              <div><span>Enrolled</span><strong>{s.batch.startedOn}</strong></div>
            </div>
          </div>
        </Card>

        <Card title="Courses & Test Series" icon="fa-graduation-cap" action={<span className="s360-count-chip">{s.courses.length} enrolled</span>}>
          <ul className="s360-courses">
            {s.courses.map((c, i) => (
              <li key={i}>
                <span className={`s360-course-icon ${c.type}`}>
                  <i className={`fa ${c.type === 'series' ? 'fa-tasks' : 'fa-book'}`} />
                </span>
                <div className="s360-course-meta">
                  <span className="s360-course-name">{c.name}</span>
                  <div className="s360-progress-bar">
                    <div style={{ width: `${c.progress}%` }} />
                  </div>
                </div>
                <span className="s360-course-pct">{c.progress}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Row 4 — Questions daily + Mock performance */}
      <div className="s360-grid s360-grid-2">
        <Card
          title="Questions Solved — Day-wise"
          icon="fa-bar-chart"
          action={
            <div className="s360-seg">
              {['14d', '30d'].map((r) => (
                <button key={r} className={range === r ? 'active' : ''} onClick={() => setRange(r)}>{r}</button>
              ))}
            </div>
          }
        >
          <BarChart
            data={s.questionsDaily}
            labels={s.questionsDaily.map((_, i) => `${i + 1}`)}
          />
        </Card>

        <Card
          title="Mock Test Performance"
          icon="fa-trophy"
          action={
            <span className={`s360-delta ${mockDelta >= 0 ? 'up' : 'down'}`}>
              <i className={`fa fa-arrow-${mockDelta >= 0 ? 'up' : 'down'}`} /> {Math.abs(mockDelta)}%
            </span>
          }
        >
          <LineChart points={s.mockTests} />
          <div className="s360-mock-foot">
            <span>Latest: <strong>{lastMock}%ile</strong></span>
            <span>Best: <strong>{Math.max(...s.mockTests.map((m) => m.percentile))}%ile</strong></span>
            <span>Avg: <strong>{avgMock}%ile</strong></span>
          </div>
        </Card>
      </div>

      {/* Row 5 — Offline classes + Streak */}
      <div className="s360-grid s360-grid-2">
        <Card
          title="Offline Classes Attended"
          icon="fa-check-square-o"
          action={<span className="s360-count-chip">{attendancePct}% overall</span>}
        >
          <div className="s360-attend">
            <BarChart
              data={s.classesAttended.map((w) => w.attended)}
              labels={s.classesAttended.map((w) => w.week)}
              color="#28c76f"
              height={150}
            />
            <p className="s360-attend-note">
              <strong>{totalAttended}</strong> of {totalClasses} sessions attended over the last 8 weeks.
            </p>
          </div>
        </Card>

        <Card title="Online Streaks" icon="fa-fire">
          <div className="s360-streak">
            <div className="s360-streak-big">
              <i className="fa fa-fire" />
              <div>
                <strong>{s.stats.currentStreak}</strong>
                <span>day current streak</span>
              </div>
            </div>
            <div className="s360-streak-week">
              {dayLabels.map((d, i) => (
                <div key={i} className={`s360-streak-day${i < 5 ? ' lit' : ''}`}>
                  <span className="s360-streak-flame"><i className="fa fa-fire" /></span>
                  <span className="s360-streak-dl">{d}</span>
                </div>
              ))}
            </div>
            <div className="s360-streak-foot">
              <span>Best streak <strong>{s.stats.bestStreak} days</strong></span>
              <span>Avg watch <strong>1.8 hrs/day</strong></span>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 6 — Activity map */}
      <Card title="Overall Activity Map" icon="fa-calendar" action={<span className="s360-muted">Last 12 weeks</span>}>
        <div className="s360-heatmap-wrap">
          <div className="s360-heatmap">
            {ACTIVITY.map((week, wi) => (
              <div className="s360-heat-week" key={wi}>
                {week.map((lvl, di) => (
                  <span key={di} className={`s360-heat-cell lvl-${lvl}`} title={`Level ${lvl}`} />
                ))}
              </div>
            ))}
          </div>
          <div className="s360-heat-legend">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((l) => <span key={l} className={`s360-heat-cell lvl-${l}`} />)}
            <span>More</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function KpiTile({ icon, tint, value, label, sub }) {
  return (
    <div className="s360-kpi">
      <span className="s360-kpi-icon" style={{ background: `${tint}1a`, color: tint }}>
        <i className={`fa ${icon}`} />
      </span>
      <div className="s360-kpi-meta">
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
      {sub && <span className="s360-kpi-sub">{sub}</span>}
    </div>
  );
}
