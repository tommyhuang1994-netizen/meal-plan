'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useT, fmtMonthYear, fmtDateInMonth } from '../../lib/i18n';
import { getParentOrders, getParentOrderDetail, updateParentOrderDay, monthLabel, DEFAULT_MONTH, CHEF_CHOICE } from '../../lib/orderStore';
import { priceForDate, dishNamesFor } from '../../lib/pricing';
import DayMenuSheet from './DayMenuSheet';
import { isDateLocked, formatDeadline } from '../../lib/cutoff';

const fmtRM = (n) => `RM ${Number(n || 0).toFixed(2)}`;

// "Cambridge Year 5", or just "Cambridge Plus" — the division sometimes already
// carries the group name, and repeating it reads as "Cambridge Cambridge Plus".
// Days on this order that are still before their cut-off.
function editableCountOf(detailDates) {
  return detailDates.filter(iso => !isDateLocked(iso)).length;
}

function classLabel(o) {
  if (!o.division) return o.classGroup;
  return o.division.startsWith(o.classGroup) ? o.division : `${o.classGroup} ${o.division}`;
}

// cutoffDate = 1st of the order month minus 7 days (e.g. June order → cutoff May 25)
const MOCK_ORDERS = [
  { id: 'ORD-001', childName: 'Ahmad Irfan', month: 'April 2026', schoolDays: 22, status: 'delivered', cutoffDate: 'Mar 25, 2026' },
  { id: 'ORD-002', childName: 'Ahmad Irfan', month: 'May 2026',   schoolDays: 20, status: 'delivered', cutoffDate: 'Apr 24, 2026' },
  { id: 'ORD-003', childName: 'Nur Aisyah',  month: 'May 2026',   schoolDays: 20, status: 'delivered', cutoffDate: 'Apr 24, 2026' },
  { id: 'ORD-004', childName: 'Nur Aisyah',  month: 'June 2026',  schoolDays: 21, status: 'confirmed', cutoffDate: 'May 25, 2026' },
];

const STATUS_CONFIG = {
  pending:   { bg: '#FEF9C3', color: '#854D0E', dot: '#CA8A04' },
  confirmed: { bg: '#DCFCE7', color: '#14532D', dot: '#16A34A' },
  delivered: { bg: '#F0F9FF', color: '#0C4A6E', dot: '#0284C7' },
};


export default function ParentPage() {
  const { t, lang } = useT();

  // Orders live in localStorage, which the server cannot read — load after
  // mount so the first client render matches the server's.
  const [orders, setOrders]     = useState([]);
  const [openId, setOpenId]     = useState(null);
  const [detail, setDetail]     = useState([]);

  const [editable, setEditable] = useState({});   // receipt id -> open day count
  const [editDay, setEditDay] = useState(null);  // { order, row } being changed

  useEffect(() => {
    const list = getParentOrders();
    setOrders(list);
    // Counting open days needs each order's dates, so gather them once here
    // rather than re-reading storage on every render.
    const counts = {};
    for (const o of list) {
      const dates = getParentOrderDetail(o.studentName, o.monthKey).map(r => r.date);
      counts[o.id] = editableCountOf(dates);
    }
    setEditable(counts);
  }, []);

  const editableCount = (o) => editable[o.id] ?? 0;
  useEffect(() => {
    if (!openId) { setDetail([]); return; }
    const o = orders.find(x => x.id === openId);
    setDetail(o ? getParentOrderDetail(o.studentName, o.monthKey) : []);
  }, [openId, orders]);

  // The CTA points at the open ordering cycle, and stands down once every
  // order for it has been placed.
  const cycleOrders = orders.filter(o => o.monthKey === DEFAULT_MONTH);
  const hasOrdered = cycleOrders.length > 0;
  const showCTA = true;   // ordering again replaces the current order
  const NEXT_MONTH_LABEL = monthLabel(DEFAULT_MONTH, lang);
  const grandTotal = cycleOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <main style={{ background: '#FAFAFA', minHeight: '100dvh' }}>
      {/* Header */}
      <header style={styles.header}>
        <Link href="/" style={styles.backLink}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t('common.back')}
        </Link>
        <div>
          <h1 style={styles.headerTitle}>{t('parent.title')}</h1>
          <p style={styles.headerSub}>{t('parent.subtitle')}</p>
        </div>
      </header>

      <div style={styles.container}>

        {/* CTA Banner — Order Next Month */}
        {showCTA && (
          <div style={styles.ctaBanner}>
            <div style={styles.ctaLeft}>
              <div style={styles.ctaIconWrap}>
                <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p style={styles.ctaLabel}>{t('parent.orderFor')}</p>
                <p style={styles.ctaMonth}>{NEXT_MONTH_LABEL}</p>
                <p style={styles.ctaHint}>{hasOrdered ? t('parent.alreadyOrdered') : t('parent.notSubmitted')}</p>
              </div>
            </div>
            <Link
              href="/parent/order"
              style={styles.ctaButton}
              onMouseEnter={e => e.currentTarget.style.background = '#145A32'}
              onMouseLeave={e => e.currentTarget.style.background = '#1B5E20'}
            >
              {hasOrdered ? t('parent.changeOrder') : t('parent.placeOrder')}
            </Link>
          </div>
        )}

        {/* Orders placed from this browser */}
        {orders.length > 0 && (
          <section>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
              <h2 style={styles.sectionTitle}>{t('parent.myOrders')}</h2>
              {cycleOrders.length > 0 && (
                <span style={{ fontSize:13, color:'#6B7280' }}>
                  {t('parent.monthTotal', { month: monthLabel(DEFAULT_MONTH, lang) })}
                  <strong style={{ color:'#1B5E20', marginLeft:6, fontSize:15 }}>{fmtRM(grandTotal)}</strong>
                </span>
              )}
            </div>

            <div style={styles.orderList}>
              {orders.map(o => {
                const isOpen = openId === o.id;
                return (
                  <div key={o.id} style={styles.orderCard}>
                    <div style={styles.orderTop}>
                      <div style={{ minWidth:0 }}>
                        <p style={styles.mealName}>{monthLabel(o.monthKey, lang)}</p>
                        <p style={styles.childName}>
                          <svg width="12" height="12" fill="none" stroke="#6B7280" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 4, flexShrink: 0 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {o.studentName}
                          {o.classGroup && (
                            <span style={{ color:'#9CA3AF', marginLeft:6 }}>· {classLabel(o)}</span>
                          )}
                        </p>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <p style={{ margin:0, fontSize:19, fontWeight:800, color:'#1B5E20', fontVariantNumeric:'tabular-nums' }}>{fmtRM(o.total)}</p>
                        <p style={{ margin:'2px 0 0', fontSize:12, color:'#9CA3AF' }}>{t('parent.schoolDays', { n: o.dayCount })}</p>
                      </div>
                    </div>

                    {o.planLabel && (
                      <p style={{ margin:'8px 0 0', fontSize:12.5, color:'#6B7280' }}>{o.planLabel}</p>
                    )}

                    <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      <button onClick={() => setOpenId(isOpen ? null : o.id)} aria-expanded={isOpen}
                        style={{ background:'none', border:'none', padding:0, cursor:'pointer',
                          color:'#1B5E20', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>
                        {isOpen ? t('parent.hideDays') : t('parent.viewDays', { n: o.dayCount })}
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform 180ms' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Change this child's order. Only dates still open can
                          actually be altered — the order page enforces it. */}
                      {editableCount(o) > 0 ? (
                        <Link href={`/parent/order?child=${encodeURIComponent(o.studentName)}`}
                          style={{ marginLeft:'auto', color:'#1B5E20', fontSize:13, fontWeight:700, textDecoration:'none',
                            border:'1.5px solid #1B5E20', borderRadius:8, padding:'5px 12px' }}>
                          {t('parent.changeOrder')}
                        </Link>
                      ) : (
                        <span style={{ marginLeft:'auto', color:'#9CA3AF', fontSize:12, fontWeight:600 }}>
                          {t('parent.allClosed')}
                        </span>
                      )}
                    </div>
                    {editableCount(o) > 0 && (
                      <p style={{ margin:'6px 0 0', fontSize:11.5, color:'#9CA3AF' }}>
                        {t('parent.editableDays', { n: editableCount(o), total: o.dayCount })}
                      </p>
                    )}

                    {isOpen && (
                      <div style={{ marginTop:10, borderTop:'1px solid #F3F4F6', paddingTop:10, display:'flex', flexDirection:'column', gap:8 }}>
                        {detail.map(d => {
                          const day = parseInt(d.date.slice(8), 10);
                          const meals = [
                            d.breakfast && `${t('meal.breakfast')}: ${d.breakfast === CHEF_CHOICE ? t('order.chefsChoice') : d.breakfast}`,
                            d.lunch     && `${t('meal.lunch')}: ${d.lunch === CHEF_CHOICE ? t('order.chefsChoice') : d.lunch}`,
                            d.brunch    && `${t('meal.brunch')}: ${d.brunch === CHEF_CHOICE ? t('order.chefsChoice') : d.brunch}`,
                          ].filter(Boolean);
                          return (
                            <div key={d.date} style={{ display:'flex', gap:10, alignItems:'flex-start', justifyContent:'space-between' }}>
                              <div style={{ minWidth:0 }}>
                                <p style={{ margin:0, fontSize:12.5, fontWeight:600, color:'#374151' }}>
                                  {fmtDateInMonth(lang, o.monthKey, day, false)}
                                </p>
                                {meals.map(m => (
                                  <p key={m} style={{ margin:'1px 0 0', fontSize:12, color:'#6B7280', lineHeight:1.45 }}>{m}</p>
                                ))}
                              </div>
                              <div style={{ textAlign:'right', flexShrink:0 }}>
                                <span style={{ fontSize:13, fontWeight:600, color:'#111827', fontVariantNumeric:'tabular-nums' }}>
                                  {fmtRM(d.price)}
                                </span>
                                {isDateLocked(d.date) ? (
                                  <p style={{ margin:'2px 0 0', fontSize:10.5, color:'#9CA3AF', fontWeight:600 }}>
                                    {t('parent.dayClosed')}
                                  </p>
                                ) : (
                                  <button onClick={() => setEditDay({ order: o, row: d })}
                                    style={{ marginTop:3, background:'#fff', border:'1.5px solid #1B5E20', color:'#1B5E20',
                                      borderRadius:7, padding:'3px 10px', fontSize:11.5, fontWeight:700, cursor:'pointer' }}>
                                    {t('parent.change')}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid #E5E7EB', paddingTop:9, marginTop:2 }}>
                          <span style={{ fontSize:13.5, fontWeight:700, color:'#111827' }}>{t('parent.total')}</span>
                          <span style={{ fontSize:16, fontWeight:800, color:'#1B5E20', fontVariantNumeric:'tabular-nums' }}>{fmtRM(o.total)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Order History */}
        <section>
          <h2 style={styles.sectionTitle}>{t('parent.history')}</h2>

          {MOCK_ORDERS.length === 0 ? (
            <div style={styles.emptyState}>
              <svg width="40" height="40" fill="none" stroke="#D1D5DB" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p style={{ marginTop: 12, color: '#6B7280', fontSize: 15 }}>{t('parent.noOrders')}</p>
              <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>{t('parent.placeFirst')}</p>
            </div>
          ) : (
            <div style={styles.orderList}>
              {MOCK_ORDERS.map(order => {
                const s = STATUS_CONFIG[order.status];
                const isLocked = new Date() > new Date(order.cutoffDate);
                return (
                  <div key={order.id} style={styles.orderCard}>
                    <div style={styles.orderTop}>
                      <div>
                        <p style={styles.mealName}>{order.month}</p>
                        <p style={styles.childName}>
                          <svg width="12" height="12" fill="none" stroke="#6B7280" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 4, flexShrink: 0 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {order.childName}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{ ...styles.statusBadge, background: s.bg, color: s.color }}>
                          <span style={{ ...styles.statusDot, background: s.dot }} />
                          {t('status.' + order.status)}
                        </span>
                        {isLocked && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                            </svg>
                            {t('parent.locked')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={styles.orderMeta}>
                      <span style={styles.orderId}>{order.id}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <span style={styles.orderDate}>
                          <svg width="12" height="12" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 3 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {t('parent.schoolDays', { n: order.schoolDays })}
                        </span>
                        <span style={{ fontSize: 11, color: isLocked ? '#9CA3AF' : '#F97316', fontWeight: 500 }}>
                          {isLocked ? t('parent.lockedSince', { date: order.cutoffDate }) : t('parent.editBy', { date: order.cutoffDate })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Per-day editor, opened from a "Change" button on an order row */}
      {editDay && (
        <DayMenuSheet
          iso={editDay.row.date}
          monthKey={editDay.order.monthKey}
          sel={editDay.row.sel}
          onClose={() => setEditDay(null)}
          onSave={(sel) => {
            const iso = editDay.row.date;
            const { price, discount } = priceForDate(iso, sel);
            const names = dishNamesFor(iso, sel);
            updateParentOrderDay({
              studentName: editDay.order.studentName,
              monthKey: editDay.order.monthKey,
              date: iso,
              sel,
              ...names,
              price: price - discount,
            });
            // Re-read so the card total and the day list both reflect the change.
            const list = getParentOrders();
            setOrders(list);
            setDetail(getParentOrderDetail(editDay.order.studentName, editDay.order.monthKey));
            setEditDay(null);
          }}
        />
      )}
    </main>
  );
}

const styles = {
  header: {
    background: '#fff',
    borderBottom: '1px solid #F3F4F6',
    padding: '16px 20px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    color: '#6B7280',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  headerSub: {
    fontSize: 13,
    color: '#6B7280',
    margin: '4px 0 0',
  },
  container: {
    maxWidth: 640,
    margin: '0 auto',
    padding: '20px 16px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  ctaBanner: {
    background: 'linear-gradient(135deg, #1B5E20 0%, #145A32 100%)',
    borderRadius: 14,
    padding: '20px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    boxShadow: '0 4px 16px rgba(27,94,32,0.25)',
  },
  ctaLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  ctaIconWrap: {
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ctaLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 600,
  },
  ctaMonth: {
    fontSize: 17,
    fontWeight: 700,
    color: '#fff',
    margin: '2px 0 0',
  },
  ctaHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    margin: '3px 0 0',
  },
  ctaButton: {
    background: '#1B5E20',
    color: '#fff',
    border: '2px solid rgba(255,255,255,0.5)',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 150ms ease',
    flexShrink: 0,
  },
  successBanner: {
    background: '#DCFCE7',
    border: '1px solid #BBF7D0',
    borderRadius: 10,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#166534',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 12px',
  },
  emptyState: {
    background: '#fff',
    border: '1px solid #F3F4F6',
    borderRadius: 12,
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  orderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  orderCard: {
    background: '#fff',
    border: '1px solid #F3F4F6',
    borderRadius: 12,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  orderTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  mealName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  childName: {
    fontSize: 13,
    color: '#6B7280',
    margin: '4px 0 0',
    display: 'flex',
    alignItems: 'center',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 20,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },
  orderMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTop: '1px solid #F9FAFB',
  },
  orderId: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
    display: 'flex',
    alignItems: 'center',
  },
};
