'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ORDERS, DEPARTMENTS, DAY_LABELS, ALLERGY_LABELS } from '../../../lib/mockOrders';

// ── June 2026 calendar helpers ────────────────────────────────────────────────

const YEAR  = 2026;
const MONTH = 5; // June = index 5

function getDaysInMonth(year, month) {
  const days = [];
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const totalDays = new Date(year, month + 1, 0).getDate();
  // blank slots before day 1
  const blanks = firstDay === 0 ? 6 : firstDay - 1; // Mon-first grid
  for (let i = 0; i < blanks; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(d);
  return days;
}

function weekdayKey(date) {
  // date is 1-30, June 2026 starts on Monday
  const dow = new Date(YEAR, MONTH, date).getDay(); // 0=Sun
  const map = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri' };
  return map[dow] || null; // null = weekend
}

function dateLabel(date) {
  const suffixes = ['th','st','nd','rd'];
  const v = date % 100;
  const s = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  const dayKey = weekdayKey(date);
  return `${DAY_LABELS[dayKey]} - ${date}${s} June 2026`;
}

function isCutoffPassed(date) {
  // Cutoff = 7 days before the meal date
  const mealDate = new Date(YEAR, MONTH, date);
  const cutoff   = new Date(mealDate);
  cutoff.setDate(cutoff.getDate() - 7);
  return new Date() > cutoff;
}

const DAYS_GRID = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEPT_COLORS = {
  Cambridge:  { bg: '#EFF6FF', color: '#1D4ED8' },
  Homeschool: { bg: '#F0FDF4', color: '#15803D' },
  Plus:       { bg: '#FDF4FF', color: '#7E22CE' },
  Staff:      { bg: '#FFF7ED', color: '#C2410C' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function VendorDashboard() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(null); // number 1-30
  const [deptFilter, setDeptFilter]     = useState('All');

  const calendarDays = getDaysInMonth(YEAR, MONTH);
  const activeKey    = selectedDate ? weekdayKey(selectedDate) : null;

  const rawOrders = activeKey ? (ORDERS[activeKey] || []) : [];
  const filtered  = deptFilter === 'All' ? rawOrders : rawOrders.filter(o => o.dept === deptFilter);
  const isFriday  = activeKey === 'Fri';

  const bfOrders = filtered.filter(o => o.breakfast);
  const lnOrders = filtered.filter(o => o.lunch);
  const brOrders = filtered.filter(o => o.brunch);

  function openPrint() {
    if (!selectedDate || !activeKey) return;
    window.open(`/vendor/print/${activeKey}?dept=${deptFilter}&date=${selectedDate}`, '_blank');
  }

  return (
    <main style={{ background: '#FAFAFA', minHeight: '100dvh' }}>

      {/* Header */}
      <header style={{ background: '#1B5E20', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Image src="/logo.png" alt="Zera" width={140} height={40} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        <button onClick={() => router.push('/vendor')}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Sign Out
        </button>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px 60px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Calendar */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>June 2026</h2>
            {selectedDate && (
              <span style={{ fontSize: 13, color: '#6B7280' }}>{dateLabel(selectedDate)}</span>
            )}
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {DAYS_GRID.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: d === 'Sat' || d === 'Sun' ? '#D1D5DB' : '#6B7280', padding: '4px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {calendarDays.map((date, i) => {
              if (!date) return <div key={i} />;
              const key     = weekdayKey(date);
              const isWeekend = !key;
              const isSelected = selectedDate === date;
              const hasOrders  = key && (ORDERS[key]?.length > 0);
              const locked     = key && isCutoffPassed(date);

              return (
                <button
                  key={i}
                  disabled={isWeekend}
                  onClick={() => setSelectedDate(date)}
                  style={{
                    aspectRatio: '1',
                    border: isSelected ? '2px solid #1B5E20' : '1px solid #F3F4F6',
                    borderRadius: 10,
                    background: isSelected ? '#1B5E20' : isWeekend ? '#FAFAFA' : '#fff',
                    cursor: isWeekend ? 'default' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    padding: 4,
                    position: 'relative',
                    transition: 'border-color 150ms',
                  }}>
                  <span style={{
                    fontSize: 14, fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#fff' : isWeekend ? '#D1D5DB' : '#111827',
                  }}>{date}</span>

                  {/* Order count dot */}
                  {hasOrders && !isWeekend && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: isSelected ? 'rgba(255,255,255,0.7)' : '#16A34A',
                    }} />
                  )}

                  {/* Locked padlock */}
                  {locked && !isWeekend && !isSelected && (
                    <span style={{ fontSize: 8, color: '#9CA3AF', position: 'absolute', top: 3, right: 4 }}>🔒</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: '#9CA3AF' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} /> Has orders
            </span>
            <span>🔒 Past cutoff (7-day lock)</span>
          </div>
        </div>

        {/* Orders panel */}
        {!selectedDate ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: '48px 20px', border: '1px solid #F3F4F6', textAlign: 'center', color: '#9CA3AF' }}>
            <svg width="36" height="36" fill="none" stroke="#D1D5DB" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', display: 'block' }}>
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p style={{ fontWeight: 600, fontSize: 14 }}>Select a date</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Click any school day on the calendar to view orders</p>
          </div>
        ) : (
          <>
            {/* Dept filter + Print */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {DEPARTMENTS.map(d => (
                  <button key={d} onClick={() => setDeptFilter(d)}
                    style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: deptFilter === d ? '#1B5E20' : '#F3F4F6',
                      color: deptFilter === d ? '#fff' : '#374151' }}>
                    {d}
                  </button>
                ))}
              </div>
              <button onClick={openPrint}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1B5E20', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"/>
                </svg>
                Print {dateLabel(selectedDate).split(' - ')[0]}
              </button>
            </div>

            {/* Cutoff notice */}
            {isCutoffPassed(selectedDate) && (
              <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#854D0E', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                <span><strong>Order locked</strong> — cutoff passed 7 days before this date. Only admin can modify orders.</span>
              </div>
            )}

            {/* Order tables */}
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
              {dateLabel(selectedDate)}
              <span style={{ fontSize: 13, fontWeight: 500, color: '#6B7280', marginLeft: 8 }}>· {filtered.length} orders{deptFilter !== 'All' ? ` · ${deptFilter}` : ''}</span>
            </h3>

            {isFriday ? (
              <OrderTable title="Brunch" orders={brOrders} mealKey="brunch" accentColor="#7E22CE" />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <OrderTable title="Breakfast" orders={bfOrders} mealKey="breakfast" accentColor="#F97316" />
                <OrderTable title="Lunch"     orders={lnOrders} mealKey="lunch"     accentColor="#2563EB" />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// ── OrderTable ────────────────────────────────────────────────────────────────

function OrderTable({ title, orders, mealKey, accentColor }) {
  if (orders.length === 0) return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #F3F4F6', color: '#9CA3AF', fontSize: 13, textAlign: 'center' }}>
      No {title.toLowerCase()} orders
    </div>
  );
  return (
    <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #F3F4F6' }}>
      <div style={{ background: accentColor, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{title}</span>
        <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>{orders.length}</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F9FAFB' }}>
            <th style={thS}>Name</th><th style={thS}>Class</th><th style={thS}>Meal</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => {
            const dc = DEPT_COLORS[o.dept] || {};
            const hasA = o.allergies?.length > 0;
            return (
              <tr key={i} style={{ borderTop: '1px solid #F3F4F6', background: hasA ? '#FFFBF5' : 'transparent' }}>
                <td style={tdS}>
                  <div style={{ fontWeight: hasA ? 700 : 400 }}>{o.name}</div>
                  {hasA && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginTop:4 }}>
                      {o.allergies.map(a => {
                        const info = ALLERGY_LABELS[a];
                        if (!info) return null;
                        return (
                          <span key={a} style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:10, background:info.bg, color:info.color, border:`1px solid ${info.color}33`, whiteSpace:'nowrap' }}>
                            ⚠ {info.en} {info.zh}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td style={tdS}><span style={{ ...badge, background: dc.bg, color: dc.color }}>{o.dept}{o.year ? ` ${o.year}` : ''}</span></td>
                <td style={{ ...tdS, fontSize: 12 }}>{o[mealKey]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const thS  = { padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#6B7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.04em' };
const tdS  = { padding: '9px 12px', fontSize: 13, color: '#111827', verticalAlign: 'middle' };
const badge = { display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 12 };
