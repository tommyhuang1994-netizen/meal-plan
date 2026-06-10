'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MENU_BY_DATE, isFridayDate, dateKey, dayLabel, ordinal } from '../../../lib/menuData';
import { CLASS_GROUPS, getAvailableDays, isDateAvailable, getHolidayInfo, getBlockedDaysList, TERM_BREAK_NOTICE } from '../../../lib/schoolCalendar';

// ── Constants ─────────────────────────────────────────────────────────────────

const KIDS = ['Ahmad Irfan', 'Nur Aisyah'];
const COMBO_DISCOUNT = 1.00;
const CHEFS_PRICE    = { chefs_both: 10.00, chefs_bf: 4.00, chefs_ln: 6.00 };
const CHEFS_BRUNCH   = 8.00;
const ALL_CLASSES    = Object.values(CLASS_GROUPS);

// Derived per class group
function getClassDays(classGroup) {
  const all    = getAvailableDays(classGroup);
  const nonFri = all.filter(d => !isFridayDate(d));
  const fri    = all.filter(d =>  isFridayDate(d));
  return { all, nonFri, fri };
}

// Per-date ordering: each picked date is either Chef's Choice (flat daily price)
// or custom à-la-carte. Chef's Choice reuses the daily chef rates above:
// weekday = CHEFS_PRICE.chefs_both (breakfast + lunch), Friday = CHEFS_BRUNCH.
function fmt(n) { return `RM ${Number(n).toFixed(2)}`; }

// A date counts as ordered if it's Chef's Choice, or custom with ≥1 item picked.
function isDatePicked(sel) {
  return !!sel && (sel.mode === 'chef' || !!sel.breakfast || !!sel.lunch || !!sel.brunch);
}
function chefPriceFor(dayNum) {
  return isFridayDate(dayNum) ? CHEFS_BRUNCH : CHEFS_PRICE.chefs_both;
}

// ── Calendar helpers ──────────────────────────────────────────────────────────

// Weekday-only (Mon–Fri) calendar — weekends are excluded entirely.
function calendarCells() {
  const cells = [];
  let started = false;
  for (let d = 1; d <= 30; d++) {
    const dow = new Date(2026, 5, d).getDay(); // 0=Sun … 6=Sat
    if (dow === 0 || dow === 6) continue;      // skip weekends
    if (!started) {
      for (let b = 0; b < dow - 1; b++) cells.push(null); // align to Monday start
      started = true;
    }
    cells.push(d);
  }
  return cells;
}
const CELLS = calendarCells();
const GRID_H = ['Mon','Tue','Wed','Thu','Fri'];

// ── Initial state ─────────────────────────────────────────────────────────────

const ALLERGY_OPTIONS = [
  { id: 'peanuts',    en: 'Peanuts',    zh: '花生'   },
  { id: 'shellfish',  en: 'Shellfish',  zh: '贝类'   },
  { id: 'dairy',      en: 'Dairy',      zh: '乳制品' },
  { id: 'eggs',       en: 'Eggs',       zh: '鸡蛋'   },
  { id: 'gluten',     en: 'Gluten',     zh: '麸质'   },
  { id: 'treeNuts',   en: 'Tree Nuts',  zh: '坚果'   },
  { id: 'noSpicy',    en: 'No Spicy',   zh: '不辣'   },
  { id: 'vegetarian', en: 'Vegetarian', zh: '素食'   },
];

const initChild = () => ({
  classGroup:     null,
  dateSelections: {},    // { "2026-06-22": { mode:'chef' } | { mode:'custom', breakfast, lunch } }
  allergies:      {},    // { peanuts: true, noSpicy: true, ... }
  allergyNote:    '',    // free-text for "Other"
});

// ── Pricing ───────────────────────────────────────────────────────────────────

function calcChild(data) {
  const { classGroup, dateSelections } = data;
  if (!classGroup) return { total: 0, discount: 0, isComplete: false, hint: 'Select class group', selectedCount: 0 };

  let total = 0, discount = 0;

  // Price every date the parent actually ordered (Chef's Choice = flat daily
  // rate; custom = à-la-carte). Holidays are included — they're not blocked.
  for (const key of Object.keys(dateSelections)) {
    const sel = dateSelections[key];
    if (!isDatePicked(sel)) continue;
    const dayM   = MENU_BY_DATE[key];
    const dayNum = parseInt(key.split('-')[2], 10);
    const fri    = isFridayDate(dayNum);

    if (sel.mode === 'chef') {
      total += chefPriceFor(dayNum);
    } else if (fri) {
      const br = sel.brunch ? dayM?.brunch?.find(x => x.id === sel.brunch) : null;
      if (br) total += br.price;
    } else {
      const bf = sel.breakfast ? dayM?.breakfast?.find(x => x.id === sel.breakfast) : null;
      const ln = sel.lunch     ? dayM?.lunch?.find(x => x.id === sel.lunch)         : null;
      total += (bf?.price ?? 0) + (ln?.price ?? 0);
      if (bf && ln) discount += COMBO_DISCOUNT;
    }
  }
  total -= discount;

  const selectedCount = Object.values(dateSelections).filter(isDatePicked).length;
  const isComplete = selectedCount > 0;
  const hint = selectedCount === 0 ? 'Pick at least one date' : null;

  return { total, discount, isComplete, hint, selectedCount };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlaceOrderPage() {
  const [activeChild, setActiveChild] = useState(KIDS[0]);
  const [childData,   setChildData]   = useState(Object.fromEntries(KIDS.map(k => [k, initChild()])));
  const [submitted,   setSubmitted]   = useState(false);

  function update(kid, fn) {
    setChildData(prev => ({ ...prev, [kid]: fn(prev[kid]) }));
  }

  const allCalcs   = Object.fromEntries(KIDS.map(k => [k, calcChild(childData[k])]));
  const grandTotal = KIDS.reduce((s, k) => s + allCalcs[k].total, 0);
  const canSubmit  = KIDS.every(k => allCalcs[k].isComplete);

  if (submitted) {
    return (
      <main style={{ background:'#FAFAFA', minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ background:'#fff', borderRadius:16, padding:'40px 28px', maxWidth:400, width:'100%', textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.07)' }}>
          <div style={{ width:56, height:56, background:'#DCFCE7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <svg width="26" height="26" fill="none" stroke="#16A34A" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'#111827', margin:'0 0 12px' }}>Order Submitted!</h2>
          {KIDS.map(k => <p key={k} style={{ color:'#6B7280', fontSize:14, margin:'0 0 4px' }}><strong>{k}</strong>: {fmt(allCalcs[k].total)}</p>)}
          <p style={{ color:'#111827', fontWeight:700, fontSize:16, margin:'12px 0 28px' }}>Total: {fmt(grandTotal)}</p>
          <Link href="/parent" style={{ display:'block', background:'#1B5E20', color:'#fff', padding:'13px 0', borderRadius:10, fontWeight:700, fontSize:15, textDecoration:'none' }}>
            Back to My Orders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background:'#FAFAFA', minHeight:'100dvh', paddingBottom:140 }}>
      <header style={S.header}>
        <Link href="/parent" style={S.backLink}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </Link>
        <h1 style={S.headerTitle}>Place Order</h1>
        <p style={S.headerSub}>June 2026 · Chef's Choice or pick per date</p>
      </header>

      <div style={S.container}>
        <p style={S.topHint}>Chef's Choice means the kitchen decides daily. Pick per date for full control.</p>

        {KIDS.map(kid => {
          const data   = childData[kid];
          const calc   = allCalcs[kid];
          const isOpen = activeChild === kid;

          let statusLabel, statusStyle;
          if (calc.isComplete)         { statusLabel = `Ready · ${fmt(calc.total)}`;        statusStyle = { bg:'#DCFCE7', color:'#166534' }; }
          else if (!data.classGroup)   { statusLabel = 'Select class group';               statusStyle = { bg:'#F3F4F6', color:'#6B7280' }; }
          else                         { statusLabel = `${data.classGroup} · ${calc.hint || 'Pick dates'}`; statusStyle = { bg:'#E8F5E9', color:'#1B5E20' }; }

          return (
            <div key={kid} style={{ ...S.childCard, border:`1.5px solid ${isOpen ? '#1B5E20' : '#F3F4F6'}` }}>
              <button onClick={() => setActiveChild(isOpen ? null : kid)} style={S.childHeader} aria-expanded={isOpen}>
                <div style={{ ...S.kidAvatar, background: isOpen ? '#1B5E20' : '#F3F4F6' }}>
                  <svg width="16" height="16" fill="none" stroke={isOpen ? '#fff' : '#9CA3AF'} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div style={{ flex:1, textAlign:'left' }}>
                  <p style={{ margin:0, fontWeight:700, fontSize:15, color:'#111827' }}>{kid}</p>
                  <span style={{ ...S.statusBadge, background:statusStyle.bg, color:statusStyle.color }}>{statusLabel}</span>
                </div>
                <svg width="18" height="18" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 200ms ease', flexShrink:0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div style={S.childBody}>

                  {/* Step 0: Class group */}
                  <p style={S.bodyLabel}>Class Group</p>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                    {ALL_CLASSES.map(cls => {
                      const active = data.classGroup === cls;
                      const colors = { Cambridge:'#1565C0', Homeschool:'#1B5E20', Plus:'#558B2F' };
                      const c = colors[cls] || '#1B5E20';
                      return (
                        <button key={cls} onClick={() => update(kid, d => ({ ...d, classGroup: cls, dateSelections: {} }))}
                          style={{ padding:'8px 16px', borderRadius:20, border:`2px solid ${active ? c : '#E5E7EB'}`, background: active ? c : '#fff', color: active ? '#fff' : '#374151', fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 150ms', touchAction:'manipulation' }}>
                          {cls}
                        </button>
                      );
                    })}
                  </div>

                  {/* Term break notice */}
                  {data.classGroup && TERM_BREAK_NOTICE[data.classGroup] && (
                    <div style={{ background:'#FEF9C3', border:'1px solid #FDE047', borderRadius:9, padding:'9px 12px', fontSize:12, color:'#854D0E', display:'flex', gap:7, alignItems:'center', marginBottom:4 }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink:0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {TERM_BREAK_NOTICE[data.classGroup]}
                    </div>
                  )}

                  {data.classGroup && (() => {
                    const { nonFri, fri } = getClassDays(data.classGroup);
                    return (
                      <p style={{ fontSize:12, color:'#6B7280', margin:'0 0 4px' }}>
                        <strong>{nonFri.length}</strong> school days · <strong>{fri.length}</strong> Friday{fri.length !== 1 ? 's' : ''} available in June 2026
                      </p>
                    );
                  })()}

                  {/* Calendar — only show after class selected */}
                  {!data.classGroup && (
                    <p style={{ fontSize:13, color:'#9CA3AF', textAlign:'center', padding:'16px 0' }}>Select your child's class group above to continue.</p>
                  )}

                  {data.classGroup && (
                    <DateCalendar
                      kid={kid}
                      classGroup={data.classGroup}
                      dateSelections={data.dateSelections}
                      onSelect={(key, type, itemId) => update(kid, d => ({
                        ...d,
                        dateSelections: {
                          ...d.dateSelections,
                          [key]: itemId
                            ? { ...(d.dateSelections[key] || {}), mode: 'custom', [type]: itemId }
                            : (() => { const s = { ...(d.dateSelections[key] || {}) }; delete s[type]; return s; })(),
                        },
                      }))}
                      onSetDate={(key, next) => update(kid, d => {
                        const ds = { ...d.dateSelections };
                        if (next == null) delete ds[key]; else ds[key] = next;
                        return { ...d, dateSelections: ds };
                      })}
                    />
                  )}

                  {/* ── Allergies & Dietary ── */}
                  <p style={{ ...S.bodyLabel, marginTop: data.classGroup ? 20 : 16 }}>
                    Food Allergies &amp; Preferences · <span style={{ fontSize:10, color:'#9CA3AF', textTransform:'none', letterSpacing:0 }}>请告知食物过敏或饮食偏好</span>
                  </p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
                    {ALLERGY_OPTIONS.map(opt => {
                      const active = !!data.allergies[opt.id];
                      return (
                        <button key={opt.id}
                          onClick={() => update(kid, d => ({ ...d, allergies: { ...d.allergies, [opt.id]: !d.allergies[opt.id] } }))}
                          aria-pressed={active}
                          style={{
                            display:'inline-flex', alignItems:'center', gap:5,
                            padding:'7px 13px', borderRadius:20, border:`1.5px solid ${active ? '#DC2626' : '#E5E7EB'}`,
                            background: active ? '#FFF5F5' : '#F9FAFB',
                            color: active ? '#DC2626' : '#374151',
                            fontWeight: active ? 700 : 500, fontSize:13, cursor:'pointer',
                            transition:'all 150ms', touchAction:'manipulation',
                          }}>
                          {active && (
                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          )}
                          {opt.en} <span style={{ fontSize:11, opacity:0.7 }}>{opt.zh}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:5 }}>
                      Other notes · 其他备注
                    </label>
                    <input
                      value={data.allergyNote}
                      onChange={e => update(kid, d => ({ ...d, allergyNote: e.target.value }))}
                      placeholder="e.g. No beef / 不吃牛肉"
                      style={{ width:'100%', padding:'11px 12px', borderRadius:9, border:'1.5px solid #E5E7EB', fontSize:16, outline:'none', boxSizing:'border-box', background:'#fff' }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky bar */}
      <div style={S.stickyBottom}>
        <div style={S.summaryContainer}>
          <div style={S.priceRow}>
            {KIDS.map(k => allCalcs[k].total > 0 && (
              <span key={k} style={S.chip}>
                <svg width="11" height="11" fill="none" stroke="#6B7280" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                {k.split(' ')[0]}: {fmt(allCalcs[k].total)}
              </span>
            ))}
          </div>
          <div style={S.submitRow}>
            <div>
              <p style={S.totalLabel}>Grand Total</p>
              <p style={S.totalAmount}>{fmt(grandTotal)}</p>
            </div>
            <button onClick={() => canSubmit && setSubmitted(true)} disabled={!canSubmit}
              style={{ ...S.submitBtn, opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
              Confirm Order
            </button>
          </div>
          {!canSubmit && (
            <p style={S.submitHint}>
              {KIDS.filter(k => !allCalcs[k].isComplete).map(k => `${k.split(' ')[0]}: ${allCalcs[k].hint}`).filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

// ── MealDots ──────────────────────────────────────────────────────────────────
// Two stacked circles on the left of a calendar cell: breakfast (top) + lunch
// (bottom). Each fills with its meal colour once that meal is picked for the day.
// Fridays are brunch-only → a single olive dot.

function Dot({ filled, color }) {
  return (
    <span style={{
      width:7, height:7, borderRadius:'50%', boxSizing:'border-box',
      border:`1.5px solid ${filled ? color : '#D1D5DB'}`,
      background: filled ? color : 'transparent',
      transition:'all 120ms', display:'block',
    }} />
  );
}

function MealDots({ isFri, sel }) {
  const chef = sel?.mode === 'chef'; // Chef's Choice covers the whole day
  return (
    <span style={{ position:'absolute', left:3, top:'50%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', gap:3 }}>
      {isFri ? (
        <Dot filled={chef || !!sel?.brunch} color="#558B2F" />
      ) : (
        <>
          <Dot filled={chef || !!sel?.breakfast} color="#D97706" />
          <Dot filled={chef || !!sel?.lunch}     color="#2563EB" />
        </>
      )}
    </span>
  );
}

// ── DateCalendar ──────────────────────────────────────────────────────────────

function DateCalendar({ kid, classGroup, dateSelections, onSelect, onSetDate }) {
  const [openDate, setOpenDate] = useState(null);
  const availableDays = getAvailableDays(classGroup);

  // Lock page scroll while the date sheet is open so the popup feels modal.
  useEffect(() => {
    if (!openDate) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [openDate]);

  const totalSelected = Object.values(dateSelections).filter(isDatePicked).length;

  return (
    <div style={{ marginTop:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <p style={S.bodyLabel}>Pick per date · June 2026</p>
        <span style={{ fontSize:12, color: totalSelected > 0 ? '#1B5E20' : '#9CA3AF', fontWeight:600 }}>
          {totalSelected} day{totalSelected !== 1 ? 's' : ''} selected
        </span>
      </div>

      {/* Calendar grid */}
      <div style={{ background:'#F9FAFB', borderRadius:12, padding:'12px 10px', marginBottom:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:3, marginBottom:3 }}>
          {GRID_H.map(d => (
            <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:'#9CA3AF', padding:'2px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:3 }}>
          {CELLS.map((date, i) => {
            if (!date) return <div key={i} />;
            const dow      = new Date(2026, 5, date).getDay();
            const info      = getHolidayInfo(classGroup, date);
            const available = isDateAvailable(classGroup, date);
            const isFri     = dow === 5;

            if (!available && info) {
              const isBreak = info.type === 'break';
              const accent  = isBreak ? '#D97706' : '#DC2626';
              const hKey    = dateKey(date);
              const hSel    = dateSelections[hKey] || {};
              const hOpen   = openDate === date;
              const hFri    = dow === 5;
              // Holidays are no longer hard-blocked — tappable to order with a warning.
              return (
                <button key={i} title={`${info.name} — holiday, tap to order anyway`}
                  onClick={() => setOpenDate(hOpen ? null : date)}
                  style={{ position:'relative', aspectRatio:'1', borderRadius:7,
                    background: isBreak ? '#FFFBEB' : '#FFF5F5',
                    border:`${hOpen ? '1.5px' : '1px'} solid ${hOpen ? accent : (isBreak ? '#FDE68A' : '#FECACA')}`,
                    cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1, padding:'2px 1px 2px 11px',
                    transition:'all 120ms', touchAction:'manipulation',
                  }}>
                  <MealDots isFri={hFri} sel={hSel} />
                  <span style={{ fontSize:11, color: accent, fontWeight:700, lineHeight:1 }}>{date}</span>
                  <span style={{ fontSize:8, color: accent, fontWeight:600, lineHeight:1, textAlign:'center', maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', padding:'0 1px' }}>
                    {info.short}
                  </span>
                </button>
              );
            }

            const key    = dateKey(date);
            const sel    = dateSelections[key] || {};
            const hasSel = isDatePicked(sel);
            const isOpen = openDate === date;

            return (
              <button key={i} onClick={() => setOpenDate(isOpen ? null : date)}
                style={{
                  position:'relative',
                  aspectRatio:'1', borderRadius:7,
                  border:`1.5px solid ${isOpen ? (isFri?'#558B2F':'#1B5E20') : hasSel ? (isFri?'#B7D7A8':'#C8E6C9') : '#E5E7EB'}`,
                  background: isOpen ? (isFri?'#F1F8E9':'#E8F5E9') : hasSel ? '#F0FDF4' : '#fff',
                  cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, padding:'2px 2px 2px 11px',
                  transition:'all 120ms',
                }}>
                <MealDots isFri={isFri} sel={sel} />
                <span style={{ fontSize:12, fontWeight: isOpen||hasSel ? 700 : 500, color: isOpen||hasSel ? (isFri?'#558B2F':'#1B5E20') : '#374151' }}>
                  {date}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:12, marginBottom:12, fontSize:11, color:'#9CA3AF', flexWrap:'wrap' }}>
        <span style={{ display:'flex', alignItems:'center', gap:3 }}><span style={{ width:8, height:8, borderRadius:'50%', background:'#D97706', display:'inline-block' }} /> Breakfast</span>
        <span style={{ display:'flex', alignItems:'center', gap:3 }}><span style={{ width:8, height:8, borderRadius:'50%', background:'#2563EB', display:'inline-block' }} /> Lunch</span>
        <span style={{ display:'flex', alignItems:'center', gap:3 }}><span style={{ width:8, height:8, borderRadius:'50%', background:'#558B2F', display:'inline-block' }} /> Fri brunch</span>
        <span style={{ display:'flex', alignItems:'center', gap:3 }}><span style={{ width:8, height:8, borderRadius:2, background:'#FFFBEB', border:'1px solid #FDE68A', display:'inline-block' }} /> Term break</span>
        <span style={{ display:'flex', alignItems:'center', gap:3 }}><span style={{ width:8, height:8, borderRadius:2, background:'#FFF5F5', border:'1px solid #FECACA', display:'inline-block' }} /> Public holiday</span>
      </div>

      {/* Holiday / break list */}
      {(() => {
        const list = getBlockedDaysList(classGroup).filter(h => {
          // For H&P, group term break days — show unique names only
          return true;
        });
        // Deduplicate by name for cleaner display
        const seen = new Set();
        const unique = list.filter(h => {
          if (seen.has(h.name)) return false;
          seen.add(h.name);
          return true;
        });
        if (unique.length === 0) return null;
        return (
          <div style={{ background:'#F9FAFB', borderRadius:10, padding:'10px 12px', marginBottom:8 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px' }}>Blocked Dates</p>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {unique.map((h, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{
                    width:28, textAlign:'center', fontWeight:700, fontSize:12,
                    color: h.type === 'break' ? '#D97706' : '#DC2626',
                    background: h.type === 'break' ? '#FFFBEB' : '#FFF5F5',
                    border: `1px solid ${h.type === 'break' ? '#FDE68A' : '#FECACA'}`,
                    borderRadius:5, padding:'1px 3px', flexShrink:0,
                  }}>
                    {h.type === 'break' && list.filter(x => x.name === h.name).length > 1
                      ? `${list.filter(x => x.name === h.name).length}d`
                      : `${h.date}`
                    }
                  </span>
                  <span style={{ fontSize:12, color:'#374151' }}>{h.name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center' }}>
        Tap any date to choose <strong>Chef's Choice</strong> or pick the menu yourself. Holidays are tappable too.
      </p>

      {/* Date menu — bottom-sheet popup so parents don't have to scroll */}
      {openDate && (() => {
        const isFri  = isFridayDate(openDate);
        const key    = dateKey(openDate);
        const dayM   = MENU_BY_DATE[key];
        const sel    = dateSelections[key] || {};
        const mode   = sel.mode || null;          // 'chef' | 'custom' | null (not chosen yet)
        const hasSel = isDatePicked(sel);
        const chefPrice = isFri ? CHEFS_BRUNCH : CHEFS_PRICE.chefs_both;

        const holiday   = getHolidayInfo(classGroup, openDate);
        const isHoliday = !!holiday && !isDateAvailable(classGroup, openDate);
        const hAccent   = !isHoliday ? (isFri ? '#558B2F' : '#1B5E20')
                                     : (holiday.type === 'break' ? '#D97706' : '#DC2626');

        const close       = () => setOpenDate(null);
        const clear       = () => onSetDate(key, null);
        const chooseChef  = () => onSetDate(key, { mode: 'chef' });
        const chooseCustom = () => onSetDate(key, mode === 'custom' ? sel : { mode: 'custom' });

        // Two big option cards at the top of the sheet
        const modeCardStyle = (active, color, tint) => ({
          flex:1, display:'flex', flexDirection:'column', alignItems:'flex-start', gap:3,
          padding:'12px', borderRadius:11, cursor:'pointer', textAlign:'left',
          border:`2px solid ${active ? color : '#E5E7EB'}`,
          background: active ? tint : '#fff', touchAction:'manipulation', transition:'all 150ms',
        });

        return (
          <div role="dialog" aria-modal="true" onClick={close} style={S.sheetOverlay}>
            <div onClick={e => e.stopPropagation()} style={S.sheet}>

              {/* Grab handle + sticky header */}
              <div style={S.sheetHead}>
                <div style={S.sheetGrip} />
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                  <div style={{ minWidth:0 }}>
                    <p style={{ margin:0, fontWeight:700, fontSize:16, color:'#111827' }}>
                      {dayLabel(openDate)}, {ordinal(openDate)} June
                    </p>
                    {isFri && <span style={{ fontSize:11, background:'#F1F8E9', color:'#558B2F', padding:'1px 7px', borderRadius:10, fontWeight:600 }}>Brunch only</span>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    {mode && (
                      <button onClick={clear} style={{ fontSize:13, color:'#9CA3AF', background:'none', border:'none', cursor:'pointer', padding:'4px 2px' }}>
                        Clear
                      </button>
                    )}
                    <button onClick={close} aria-label="Close" style={S.sheetClose}>
                      <svg width="16" height="16" fill="none" stroke="#6B7280" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable menu body */}
              <div style={S.sheetBody}>
                {/* Holiday warning — holidays are not blocked, only flagged */}
                {isHoliday && (
                  <div style={{ display:'flex', gap:8, alignItems:'flex-start', background: holiday.type==='break' ? '#FFFBEB' : '#FFF5F5', border:`1px solid ${holiday.type==='break' ? '#FDE68A' : '#FECACA'}`, borderRadius:9, padding:'10px 12px', marginBottom:12 }}>
                    <svg width="16" height="16" fill="none" stroke={hAccent} strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink:0, marginTop:1 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.14A2 2 0 003.83 21h16.34a2 2 0 001.72-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                    <div>
                      <p style={{ margin:0, fontSize:13, fontWeight:700, color:hAccent }}>{holiday.name} — school holiday</p>
                      <p style={{ margin:'2px 0 0', fontSize:12, color:'#6B7280', lineHeight:1.45 }}>No classes this day. You can still order if your child will be in.</p>
                    </div>
                  </div>
                )}

                {/* Step 1: how to order this day */}
                <div style={{ display:'flex', gap:10, marginBottom: mode ? 16 : 4 }}>
                  <button onClick={chooseChef} aria-pressed={mode==='chef'} style={modeCardStyle(mode==='chef', '#1B5E20', '#F0FDF4')}>
                    <svg width="20" height="20" fill="none" stroke={mode==='chef' ? '#1B5E20' : '#9CA3AF'} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3l1.5 3L10 7.5 6.5 9 5 12 3.5 9 0 7.5 3.5 6 5 3zM18 9l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zM13 14l.9 1.8L16 16.7l-1.9.9L13 19.5l-.9-1.9L10 16.7l1.9-.9L13 14z" /></svg>
                    <span style={{ fontWeight:700, fontSize:14, color: mode==='chef' ? '#1B5E20' : '#111827' }}>Chef's Choice</span>
                    <span style={{ fontSize:11, color:'#6B7280' }}>Kitchen decides · {fmt(chefPrice)}</span>
                  </button>
                  <button onClick={chooseCustom} aria-pressed={mode==='custom'} style={modeCardStyle(mode==='custom', '#2563EB', '#EFF6FF')}>
                    <svg width="20" height="20" fill="none" stroke={mode==='custom' ? '#2563EB' : '#9CA3AF'} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" /></svg>
                    <span style={{ fontWeight:700, fontSize:14, color: mode==='custom' ? '#2563EB' : '#111827' }}>I'll Choose</span>
                    <span style={{ fontSize:11, color:'#6B7280' }}>Pick the menu</span>
                  </button>
                </div>

                {/* Nudge when nothing chosen yet */}
                {!mode && (
                  <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center', margin:'10px 0 2px' }}>
                    Choose how you'd like to order {dayLabel(openDate)}.
                  </p>
                )}

                {/* Step 2a: Chef's Choice confirmation */}
                {mode === 'chef' && (
                  <div style={{ display:'flex', gap:8, alignItems:'center', background:'#F0FDF4', border:'1px solid #C8E6C9', borderRadius:10, padding:'12px' }}>
                    <svg width="18" height="18" fill="none" stroke="#16A34A" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink:0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <p style={{ margin:0, fontSize:13, color:'#166534', lineHeight:1.45 }}>
                      <strong>Chef's Choice set.</strong> Our kitchen prepares {isFri ? 'brunch' : 'breakfast &amp; lunch'} for this day — <strong>{fmt(chefPrice)}</strong>.
                    </p>
                  </div>
                )}

                {/* Step 2b: pick from the menu */}
                {mode === 'custom' && (
                  isFri ? (
                    <MealItems title="Brunch" items={dayM?.brunch || []} selected={sel.brunch} accentColor="#558B2F"
                      onSelect={id => onSelect(key, 'brunch', id === sel.brunch ? null : id)} />
                  ) : (
                    <>
                      <MealItems title="Breakfast (optional)" items={dayM?.breakfast || []} selected={sel.breakfast} accentColor="#D97706"
                        onSelect={id => onSelect(key, 'breakfast', id === sel.breakfast ? null : id)} />
                      <div style={{ marginTop:12 }}>
                        <MealItems title="Lunch (optional)" items={dayM?.lunch || []} selected={sel.lunch} accentColor="#2563EB"
                          onSelect={id => onSelect(key, 'lunch', id === sel.lunch ? null : id)} />
                      </div>
                      {sel.breakfast && sel.lunch && (
                        <p style={{ fontSize:11, color:'#16A34A', fontWeight:600, marginTop:8 }}>
                          ✓ Combo — RM 1.00 discount applied
                        </p>
                      )}
                    </>
                  )
                )}
              </div>

              {/* Sticky footer — selections auto-save, Done just closes */}
              <div style={S.sheetFoot}>
                <button onClick={close} style={S.sheetDone}>
                  {hasSel ? 'Done' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── MealItems ─────────────────────────────────────────────────────────────────

function MealItems({ title, items, selected, onSelect, accentColor }) {
  return (
    <div>
      <p style={{ margin:'0 0 7px', fontSize:12, fontWeight:600, color:'#374151' }}>{title}</p>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {items.map(item => {
          const active = selected === item.id;
          return (
            <button key={item.id} onClick={() => onSelect(item.id)} aria-pressed={active}
              style={{ ...S.mealCard, ...(active ? { borderColor:accentColor, background:'#FAFAFA' } : {}) }}>
              <div style={{ flex:1, textAlign:'left' }}>
                <p style={{ margin:0, fontSize:13, fontWeight: active ? 600 : 500, color:'#111827' }}>{item.name}</p>
                <p style={{ margin:'2px 0 0', fontSize:11, color:'#9CA3AF', lineHeight:1.4 }}>{item.desc}</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                <span style={{ fontSize:13, fontWeight:700, color: active ? accentColor : '#374151', fontVariantNumeric:'tabular-nums' }}>{fmt(item.price)}</span>
                <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${active ? accentColor : '#D1D5DB'}`, background: active ? accentColor : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 150ms' }}>
                  {active && <svg width="9" height="9" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  header:       { background:'#fff', borderBottom:'1px solid #F3F4F6', padding:'calc(16px + env(safe-area-inset-top)) 20px 20px', display:'flex', flexDirection:'column', gap:10 },
  backLink:     { display:'inline-flex', alignItems:'center', gap:4, color:'#6B7280', textDecoration:'none', fontSize:13, fontWeight:500 },
  headerTitle:  { fontSize:22, fontWeight:700, color:'#111827', margin:0 },
  headerSub:    { fontSize:13, color:'#6B7280', margin:0 },
  container:    { maxWidth:640, margin:'0 auto', padding:'20px 16px', display:'flex', flexDirection:'column', gap:12 },
  topHint:      { fontSize:13, color:'#6B7280', margin:0, lineHeight:1.5 },
  childCard:    { background:'#fff', borderRadius:14, overflow:'hidden', transition:'border-color 150ms ease' },
  childHeader:  { display:'flex', alignItems:'center', gap:12, width:'100%', padding:'14px 16px', background:'transparent', border:'none', cursor:'pointer', touchAction:'manipulation' },
  kidAvatar:    { width:38, height:38, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 150ms' },
  statusBadge:  { display:'inline-block', fontSize:12, fontWeight:600, padding:'2px 8px', borderRadius:20, marginTop:3 },
  childBody:    { padding:'0 16px 20px', borderTop:'1px solid #F9FAFB' },
  bodyLabel:    { fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.05em', margin:'16px 0 8px' },
  planCard:     { display:'flex', alignItems:'center', gap:12, background:'#F9FAFB', border:'1.5px solid #F3F4F6', borderRadius:10, padding:'11px 12px', cursor:'pointer', width:'100%', transition:'border-color 150ms', touchAction:'manipulation' },
  planCardActive:{ border:'1.5px solid #DC2626', background:'#F0FDF4' },
  radio:        { width:20, height:20, borderRadius:'50%', border:'2px solid', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 150ms', flexShrink:0 },
  mealCard:     { display:'flex', alignItems:'center', gap:10, background:'#F9FAFB', border:'1.5px solid #F3F4F6', borderRadius:8, padding:'9px 10px', cursor:'pointer', width:'100%', transition:'border-color 150ms', touchAction:'manipulation' },
  stickyBottom: { position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:'1px solid #F3F4F6', boxShadow:'0 -4px 20px rgba(0,0,0,0.08)', zIndex:100 },
  summaryContainer:{ maxWidth:640, margin:'0 auto', padding:'10px 16px calc(18px + env(safe-area-inset-bottom))' },
  priceRow:     { display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' },
  chip:         { display:'inline-flex', alignItems:'center', gap:4, background:'#F9FAFB', border:'1px solid #F3F4F6', borderRadius:20, padding:'4px 10px', fontSize:13, fontWeight:600, color:'#374151' },
  submitRow:    { display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 },
  totalLabel:   { fontSize:12, color:'#9CA3AF', margin:0, fontWeight:500 },
  totalAmount:  { fontSize:22, fontWeight:800, color:'#111827', margin:'2px 0 0', fontVariantNumeric:'tabular-nums' },
  submitBtn:    { background:'#1B5E20', color:'#fff', border:'none', borderRadius:10, padding:'13px 24px', fontSize:15, fontWeight:700, transition:'opacity 150ms', whiteSpace:'nowrap' },
  submitHint:   { fontSize:12, color:'#9CA3AF', margin:'6px 0 0', textAlign:'center' },

  // ── Date menu bottom-sheet popup ──
  sheetOverlay: { position:'fixed', inset:0, zIndex:200, background:'rgba(17,24,39,0.5)', display:'flex', alignItems:'flex-end', justifyContent:'center', animation:'fadeIn 180ms ease' },
  sheet:        { background:'#fff', width:'100%', maxWidth:520, borderTopLeftRadius:20, borderTopRightRadius:20, maxHeight:'88vh', display:'flex', flexDirection:'column', boxShadow:'0 -8px 40px rgba(0,0,0,0.25)', animation:'sheetUp 260ms cubic-bezier(0.32,0.72,0,1)' },
  sheetHead:    { flexShrink:0, padding:'10px 16px 12px', borderBottom:'1px solid #F3F4F6' },
  sheetGrip:    { width:38, height:4, borderRadius:4, background:'#E5E7EB', margin:'0 auto 12px' },
  sheetClose:   { width:32, height:32, borderRadius:'50%', border:'none', background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, touchAction:'manipulation' },
  sheetBody:    { overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'14px 16px 16px', flex:1 },
  sheetFoot:    { flexShrink:0, borderTop:'1px solid #F3F4F6', padding:'12px 16px calc(12px + env(safe-area-inset-bottom))', background:'#fff' },
  sheetDone:    { width:'100%', background:'#1B5E20', color:'#fff', border:'none', borderRadius:11, padding:'14px 0', fontSize:15, fontWeight:700, cursor:'pointer', touchAction:'manipulation' },
};
