'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MENU_BY_DATE, isFridayDate, dateKey } from '../../../lib/menuData';
import { CLASS_GROUPS, getAvailableDays, isDateAvailable, getHolidayInfo, getBlockedDaysList, TERM_BREAK_NOTICE } from '../../../lib/schoolCalendar';
import { MEAL_SET_DAILY_PRICE } from '../../../lib/pricingData';
import { useT, fmtFullDate } from '../../../lib/i18n';

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

// Per-date ordering: each meal slot is independently Chef's Choice or custom
// (à-la-carte). On weekdays a single "Chef's Choice — Both Meals" flag can cover
// breakfast + lunch at the bundle rate and locks out per-meal custom picks.
// Each slot value is { mode:'chef' } | { mode:'custom', id } | undefined.
// Friday is brunch-only (no "both"); chef brunch = CHEFS_BRUNCH.
function fmt(n) { return `RM ${Number(n).toFixed(2)}`; }

// A meal slot counts as ordered if it's Chef's Choice or custom with an item.
function mealPicked(m) {
  return !!m && (m.mode === 'chef' || (m.mode === 'custom' && !!m.id));
}
// A date counts as ordered if Chef's-Both is on or any meal slot is picked.
function isDatePicked(sel) {
  if (!sel) return false;
  return !!sel.chefBoth || mealPicked(sel.breakfast) || mealPicked(sel.lunch) || mealPicked(sel.brunch);
}

// Build whole-month selections from the bulk toggles. `both` = Chef's Choice
// Meal Set (both meals); `bf`/`ln` = single-meal sets. Either single-meal set (or
// the both set) also covers Friday brunch. Holidays are excluded by getAvailableDays.
function buildWholeMonth(classGroup, { both = false, bf = false, ln = false }) {
  const ds = {};
  for (const day of getAvailableDays(classGroup)) {
    const k = dateKey(day);
    if (isFridayDate(day)) {
      if (both || bf || ln) ds[k] = { brunch: { mode: 'chef' } };
    } else if (both) {
      ds[k] = { chefBoth: true };
    } else {
      const e = {};
      if (bf) e.breakfast = { mode: 'chef' };
      if (ln) e.lunch = { mode: 'chef' };
      if (e.breakfast || e.lunch) ds[k] = e;
    }
  }
  return ds;
}

// True when the manual per-date picks already cover the whole month as both-meals
// chef (weekday chefBoth, Friday chef brunch) and nothing outside the available
// days — i.e. the parent has effectively built the Chef's Choice Meal Set.
function isWholeMonthBoth(classGroup, ds) {
  const avail = getAvailableDays(classGroup);
  if (avail.length === 0) return false;
  for (const day of avail) {
    const sel = ds[dateKey(day)];
    if (isFridayDate(day)) { if (sel?.brunch?.mode !== 'chef') return false; }
    else if (!sel?.chefBoth) return false;
  }
  const availKeys = new Set(avail.map(dateKey));
  for (const k of Object.keys(ds)) {
    if (isDatePicked(ds[k]) && !availKeys.has(k)) return false; // extra (e.g. holiday) pick
  }
  return true;
}

// Drop every Friday key — the "I'll choose" (custom) plan doesn't offer Friday
// brunch, so its selections must never carry one (e.g. left over from a Chef plan).
function stripFridays(ds) {
  const out = {};
  for (const k of Object.keys(ds)) {
    if (!isFridayDate(parseInt(k.split('-')[2], 10))) out[k] = ds[k];
  }
  return out;
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
  mealSet:        false, // plan: Chef's Choice Meal Set — both meals, whole-month promo
  bfSet:          false, // plan: Chef's Choice breakfast, whole month (+ Friday brunch)
  lnSet:          false, // plan: Chef's Choice lunch, whole month (+ Friday brunch)
  illChoose:      false, // plan: I'll choose — manual per-date picks
  dateSelections: {},    // { "2026-06-22": { chefBoth?, breakfast?, lunch?, brunch? } }
  allergies:      {},    // { peanuts: true, noSpicy: true, ... }
  allergyNote:    '',    // free-text for "Other"
});

// ── Pricing ───────────────────────────────────────────────────────────────────

// Price one meal slot: chef = flat chef rate, custom = the picked item's price.
function mealCost(slot, chefRate, items) {
  if (!slot) return 0;
  if (slot.mode === 'chef') return chefRate;
  if (slot.mode === 'custom' && slot.id) return items?.find(x => x.id === slot.id)?.price ?? 0;
  return 0;
}

function calcChild(data) {
  const { classGroup, dateSelections, mealSet } = data;
  if (!classGroup) return { total: 0, discount: 0, isComplete: false, hintKey: 'order.selectClassGroup', selectedCount: 0 };

  // Chef's Choice Meal Set — promo rate per available study day. Cambridge and
  // Homeschool/Plus differ here because their day counts differ.
  if (mealSet) {
    const days = getAvailableDays(classGroup).length;
    return { total: days * MEAL_SET_DAILY_PRICE, discount: 0, isComplete: true, hintKey: null, selectedCount: days };
  }

  let total = 0, discount = 0;

  // Price every date the parent actually ordered (Chef's Choice = flat daily
  // rate; custom = à-la-carte). Holidays are included — they're not blocked.
  for (const key of Object.keys(dateSelections)) {
    const sel = dateSelections[key];
    if (!isDatePicked(sel)) continue;
    const dayM   = MENU_BY_DATE[key];
    const dayNum = parseInt(key.split('-')[2], 10);

    if (isFridayDate(dayNum)) {
      total += mealCost(sel.brunch, CHEFS_BRUNCH, dayM?.brunch);
    } else if (sel.chefBoth) {
      total += CHEFS_PRICE.chefs_both;
    } else {
      total += mealCost(sel.breakfast, CHEFS_PRICE.chefs_bf, dayM?.breakfast);
      total += mealCost(sel.lunch,     CHEFS_PRICE.chefs_ln, dayM?.lunch);
      // Combo discount only when both meals are custom item picks.
      if (sel.breakfast?.mode === 'custom' && sel.breakfast?.id &&
          sel.lunch?.mode === 'custom'     && sel.lunch?.id) discount += COMBO_DISCOUNT;
    }
  }
  total -= discount;

  const selectedCount = Object.values(dateSelections).filter(isDatePicked).length;
  const isComplete = selectedCount > 0;
  const hintKey = selectedCount === 0 ? 'order.pickAtLeastOne' : null;

  return { total, discount, isComplete, hintKey, selectedCount };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlaceOrderPage() {
  const { t, lang } = useT();
  const [activeChild, setActiveChild] = useState(KIDS[0]);
  const [childData,   setChildData]   = useState(Object.fromEntries(KIDS.map(k => [k, initChild()])));
  const [submitted,   setSubmitted]   = useState(false);

  function update(kid, fn) {
    setChildData(prev => ({ ...prev, [kid]: fn(prev[kid]) }));
  }

  // Pick a meal plan (radio, mutually exclusive). Chef plans pre-fill the calendar
  // so the cells tick automatically; "custom" (I'll choose) opens it empty.
  const selectPlan = (kid, plan) => update(kid, d => {
    if (plan === 'meal_set') return { ...d, mealSet: true,  bfSet: false, lnSet: false, illChoose: false, dateSelections: buildWholeMonth(d.classGroup, { both: true }) };
    if (plan === 'bf')       return { ...d, mealSet: false, bfSet: true,  lnSet: false, illChoose: false, dateSelections: buildWholeMonth(d.classGroup, { bf: true }) };
    if (plan === 'ln')       return { ...d, mealSet: false, bfSet: false, lnSet: true,  illChoose: false, dateSelections: buildWholeMonth(d.classGroup, { ln: true }) };
    // custom — keep existing manual picks if already custom, else start empty.
    // Fridays are dropped: the custom plan offers no Friday brunch.
    return { ...d, mealSet: false, bfSet: false, lnSet: false, illChoose: true, dateSelections: stripFridays(d.illChoose ? d.dateSelections : {}) };
  });

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
          <h2 style={{ fontSize:20, fontWeight:700, color:'#111827', margin:'0 0 12px' }}>{t('order.submitted')}</h2>
          {KIDS.map(k => <p key={k} style={{ color:'#6B7280', fontSize:14, margin:'0 0 4px' }}><strong>{k}</strong>: {fmt(allCalcs[k].total)}</p>)}
          <p style={{ color:'#111827', fontWeight:700, fontSize:16, margin:'12px 0 28px' }}>{t('order.total', { total: fmt(grandTotal) })}</p>
          <Link href="/parent" style={{ display:'block', background:'#1B5E20', color:'#fff', padding:'13px 0', borderRadius:10, fontWeight:700, fontSize:15, textDecoration:'none' }}>
            {t('order.backToOrders')}
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
          {t('common.back')}
        </Link>
        <h1 style={S.headerTitle}>{t('order.title')}</h1>
        <p style={S.headerSub}>{t('order.subtitle')}</p>
      </header>

      <div style={S.container}>
        <p style={S.topHint}>{t('order.topHint')}</p>

        {KIDS.map(kid => {
          const data   = childData[kid];
          const calc   = allCalcs[kid];
          const isOpen = activeChild === kid;

          let statusLabel, statusStyle;
          if (calc.isComplete)         { statusLabel = t('order.ready', { total: fmt(calc.total) }); statusStyle = { bg:'#DCFCE7', color:'#166534' }; }
          else if (!data.classGroup)   { statusLabel = t('order.selectClassGroup');           statusStyle = { bg:'#F3F4F6', color:'#6B7280' }; }
          else                         { statusLabel = `${data.classGroup} · ${calc.hintKey ? t(calc.hintKey) : t('order.pickDates')}`; statusStyle = { bg:'#E8F5E9', color:'#1B5E20' }; }

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
                  <p style={S.bodyLabel}>{t('order.classGroup')}</p>
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
                        {t('order.daysAvailable', { n: nonFri.length, m: fri.length, friLabel: fri.length !== 1 ? t('order.fridays') : t('order.friday') })}
                      </p>
                    );
                  })()}

                  {/* Calendar — only show after class selected */}
                  {!data.classGroup && (
                    <p style={{ fontSize:13, color:'#9CA3AF', textAlign:'center', padding:'16px 0' }}>{t('order.selectClassPrompt')}</p>
                  )}

                  {/* Meal plan — radio list. Picking any Chef's Choice plan fills the
                      calendar (cells auto-tick); "I'll choose" opens it empty. */}
                  {data.classGroup && (() => {
                    const { all, nonFri, fri } = getClassDays(data.classGroup);
                    const mealSetTotal = all.length * MEAL_SET_DAILY_PRICE;
                    const bfTotal = nonFri.length * CHEFS_PRICE.chefs_bf + fri.length * CHEFS_BRUNCH;
                    const lnTotal = nonFri.length * CHEFS_PRICE.chefs_ln + fri.length * CHEFS_BRUNCH;
                    const selected = data.mealSet ? 'meal_set' : data.bfSet ? 'bf' : data.lnSet ? 'ln' : data.illChoose ? 'custom' : null;
                    return (
                      <div style={{ display:'flex', flexDirection:'column', gap:8, margin:'8px 0 4px' }}>
                        <p style={S.bodyLabel}>{t('order.choosePlan')}</p>
                        <PlanRow active={selected === 'meal_set'} title={t('order.chefsChoice')} sub={t('order.planBothNote')} promo
                          perDay={t('order.perDay', { rate: fmt(MEAL_SET_DAILY_PRICE) })} monthly={t('order.perMonth', { total: fmt(mealSetTotal) })}
                          onPick={() => selectPlan(kid, 'meal_set')} />
                        <PlanRow active={selected === 'bf'} title={t('order.chefsChoice')} sub={t('order.planBfNote')}
                          perDay={t('order.perDay', { rate: fmt(CHEFS_PRICE.chefs_bf) })} monthly={t('order.perMonth', { total: fmt(bfTotal) })}
                          onPick={() => selectPlan(kid, 'bf')} />
                        <PlanRow active={selected === 'ln'} title={t('order.chefsChoice')} sub={t('order.planLnNote')}
                          perDay={t('order.perDay', { rate: fmt(CHEFS_PRICE.chefs_ln) })} monthly={t('order.perMonth', { total: fmt(lnTotal) })}
                          onPick={() => selectPlan(kid, 'ln')} />
                        <PlanRow active={selected === 'custom'} title={t('order.illChoose')} sub={t('order.planCustomNote')}
                          onPick={() => selectPlan(kid, 'custom')} />
                      </div>
                    );
                  })()}

                  {/* Calendar — appears once a plan is chosen. Chef plans arrive
                      pre-ticked; "I'll choose" starts empty for manual picks. */}
                  {data.classGroup && !(data.mealSet || data.bfSet || data.lnSet || data.illChoose) && (
                    <p style={{ fontSize:13, color:'#9CA3AF', textAlign:'center', padding:'14px 0' }}>{t('order.selectPlanPrompt')}</p>
                  )}

                  {data.classGroup && (data.mealSet || data.bfSet || data.lnSet || data.illChoose) && (
                    <DateCalendar
                      classGroup={data.classGroup}
                      dateSelections={data.dateSelections}
                      lockFriBrunch={data.bfSet || data.lnSet}
                      disableFri={data.illChoose}
                      onSetDate={(key, next) => update(kid, d => {
                        const ds = { ...d.dateSelections };
                        if (next == null) delete ds[key]; else ds[key] = next;
                        // A manual edit drops to the "I'll choose" plan, unless the picks
                        // still cover the whole month as both-meals chef (= Meal Set).
                        // The custom plan offers no Friday brunch, so strip Fridays then.
                        const whole = isWholeMonthBoth(d.classGroup, ds);
                        return { ...d, dateSelections: whole ? ds : stripFridays(ds), mealSet: whole, bfSet: false, lnSet: false, illChoose: !whole };
                      })}
                    />
                  )}

                  {/* ── Allergies & Dietary ── */}
                  <p style={{ ...S.bodyLabel, marginTop: data.classGroup ? 20 : 16 }}>
                    {t('order.allergies')}
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
                          {lang === 'zh' ? opt.zh : opt.en}
                        </button>
                      );
                    })}
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:5 }}>
                      {t('order.otherNotes')}
                    </label>
                    <input
                      value={data.allergyNote}
                      onChange={e => update(kid, d => ({ ...d, allergyNote: e.target.value }))}
                      placeholder={t('order.otherNotesPh')}
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
              <p style={S.totalLabel}>{t('order.grandTotal')}</p>
              <p style={S.totalAmount}>{fmt(grandTotal)}</p>
            </div>
            <button onClick={() => canSubmit && setSubmitted(true)} disabled={!canSubmit}
              style={{ ...S.submitBtn, opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
              {t('order.confirmOrder')}
            </button>
          </div>
          {!canSubmit && (
            <p style={S.submitHint}>
              {KIDS.filter(k => !allCalcs[k].isComplete).map(k => `${k.split(' ')[0]}: ${allCalcs[k].hintKey ? t(allCalcs[k].hintKey) : ''}`).filter(s => s.trim().slice(-1) !== ':').join(' · ')}
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
  const both = !!sel?.chefBoth;
  return (
    <span style={{ position:'absolute', left:3, top:'50%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', gap:3 }}>
      {isFri ? (
        <Dot filled={mealPicked(sel?.brunch)} color="#558B2F" />
      ) : (
        <>
          <Dot filled={both || mealPicked(sel?.breakfast)} color="#D97706" />
          <Dot filled={both || mealPicked(sel?.lunch)}     color="#2563EB" />
        </>
      )}
    </span>
  );
}

// ── PlanRow ───────────────────────────────────────────────────────────────────
// One meal-plan radio row: title, descriptive sub, optional per-day + monthly
// price, an optional PROMO chip, and a radio-style check (plans are mutually
// exclusive). Picking a row drives the calendar below.

function PlanRow({ active, title, sub, perDay, monthly, promo, onPick }) {
  const { t } = useT();
  const accent = '#1B5E20';
  return (
    <button onClick={onPick} aria-pressed={active} style={{
      display:'flex', alignItems:'center', gap:12, width:'100%', textAlign:'left',
      padding:'14px', borderRadius:11, cursor:'pointer', touchAction:'manipulation', transition:'all 150ms',
      border:`2px solid ${active ? accent : '#E5E7EB'}`, background: active ? '#F0FDF4' : '#F9FAFB',
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
          <span style={{ fontWeight:700, fontSize:15, color: active ? accent : '#111827' }}>{title}</span>
          {promo && (
            <span style={{ fontSize:10, fontWeight:800, letterSpacing:'0.04em', textTransform:'uppercase', padding:'2px 7px', borderRadius:20,
              background: active ? '#DCFCE7' : '#FEF3C7', color: active ? '#166534' : '#B45309' }}>{t('order.monthlyPromo')}</span>
          )}
        </div>
        <p style={{ margin:'2px 0 0', fontSize:12, color:'#6B7280', lineHeight:1.35 }}>{sub}</p>
      </div>
      {perDay && (
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <p style={{ margin:0, fontSize:14, fontWeight:800, color: active ? accent : '#111827', fontVariantNumeric:'tabular-nums' }}>{perDay}</p>
          <p style={{ margin:'1px 0 0', fontSize:11, color:'#9CA3AF', fontVariantNumeric:'tabular-nums' }}>{monthly}</p>
        </div>
      )}
      <span style={{ flexShrink:0, width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
        border:`2px solid ${active ? accent : '#D1D5DB'}`, background: active ? accent : 'transparent', transition:'all 150ms' }}>
        {active && <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </span>
    </button>
  );
}

// ── DateCalendar ──────────────────────────────────────────────────────────────

function DateCalendar({ classGroup, dateSelections, onSetDate, lockFriBrunch, disableFri }) {
  const { t, lang } = useT();
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
        <p style={S.bodyLabel}>{t('order.pickPerDate')}</p>
        <span style={{ fontSize:12, color: totalSelected > 0 ? '#1B5E20' : '#9CA3AF', fontWeight:600 }}>
          {t('order.daysSelected', { n: totalSelected })}
        </span>
      </div>

      {/* Calendar grid */}
      <div style={{ background:'#F9FAFB', borderRadius:12, padding:'12px 10px', marginBottom:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:3, marginBottom:3 }}>
          {GRID_H.map(d => (
            <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:'#9CA3AF', padding:'2px 0' }}>{t('wd.' + d)}</div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:3 }}>
          {CELLS.map((date, i) => {
            if (!date) return <div key={i} />;
            const dow      = new Date(2026, 5, date).getDay();
            const info      = getHolidayInfo(classGroup, date);
            const available = isDateAvailable(classGroup, date);
            const isFri     = dow === 5;

            // "I'll choose" plan: Fridays (brunch) aren't orderable — show as disabled.
            if (isFri && disableFri) {
              return (
                <div key={i} style={{
                  aspectRatio:'1', borderRadius:7, border:'1px dashed #E5E7EB', background:'#F9FAFB',
                  display:'flex', alignItems:'center', justifyContent:'center', opacity:0.5,
                }}>
                  <span style={{ fontSize:12, color:'#9CA3AF', textDecoration:'line-through' }}>{date}</span>
                </div>
              );
            }

            if (!available && info) {
              const isBreak = info.type === 'break';
              const accent  = isBreak ? '#D97706' : '#DC2626';
              const hKey    = dateKey(date);
              const hSel    = dateSelections[hKey] || {};
              const hOpen   = openDate === date;
              const hFri    = dow === 5;
              // Holidays are no longer hard-blocked — tappable to order with a warning.
              return (
                <button key={i} title={t('order.holidayTapTitle', { name: info.name })}
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

      {disableFri && (
        <p style={{ fontSize:11, color:'#9CA3AF', margin:'-6px 2px 12px', lineHeight:1.4 }}>{t('order.friCustomDisabled')}</p>
      )}

      {/* Legend */}
      <div style={{ display:'flex', gap:12, marginBottom:12, fontSize:11, color:'#9CA3AF', flexWrap:'wrap' }}>
        <span style={{ display:'flex', alignItems:'center', gap:3 }}><span style={{ width:8, height:8, borderRadius:'50%', background:'#D97706', display:'inline-block' }} /> {t('meal.breakfast')}</span>
        <span style={{ display:'flex', alignItems:'center', gap:3 }}><span style={{ width:8, height:8, borderRadius:'50%', background:'#2563EB', display:'inline-block' }} /> {t('meal.lunch')}</span>
        <span style={{ display:'flex', alignItems:'center', gap:3 }}><span style={{ width:8, height:8, borderRadius:'50%', background:'#558B2F', display:'inline-block' }} /> {t('meal.brunch')}</span>
        <span style={{ display:'flex', alignItems:'center', gap:3 }}><span style={{ width:8, height:8, borderRadius:2, background:'#FFFBEB', border:'1px solid #FDE68A', display:'inline-block' }} /> {t('legend.termBreak')}</span>
        <span style={{ display:'flex', alignItems:'center', gap:3 }}><span style={{ width:8, height:8, borderRadius:2, background:'#FFF5F5', border:'1px solid #FECACA', display:'inline-block' }} /> {t('legend.publicHoliday')}</span>
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
            <p style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px' }}>{t('order.blockedDates')}</p>
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
        {t('order.tapHint')}
      </p>

      {/* Date menu — bottom-sheet popup so parents don't have to scroll */}
      {openDate && (() => {
        const isFri  = isFridayDate(openDate);
        const key    = dateKey(openDate);
        const dayM   = MENU_BY_DATE[key];
        const sel    = dateSelections[key] || {};
        const hasSel = isDatePicked(sel);
        const anySel = !!(sel.chefBoth || sel.breakfast || sel.lunch || sel.brunch);

        const holiday   = getHolidayInfo(classGroup, openDate);
        const isHoliday = !!holiday && !isDateAvailable(classGroup, openDate);
        const hAccent   = !isHoliday ? (isFri ? '#558B2F' : '#1B5E20')
                                     : (holiday.type === 'break' ? '#D97706' : '#DC2626');

        const close = () => setOpenDate(null);
        const clear = () => onSetDate(key, null);

        // "Chef's Choice — Both Meals" (weekdays): exclusive toggle that clears
        // any per-meal picks and locks the per-meal controls below.
        const toggleBoth = () => onSetDate(key, sel.chefBoth ? null : { chefBoth: true });

        // Set/clear one meal slot. Any per-meal action turns Chef's-Both off; the
        // date is removed entirely once no slot is set.
        const applyMeal = (slot, val) => {
          const next = { ...sel };
          delete next.chefBoth;
          if (val == null) delete next[slot]; else next[slot] = val;
          // Auto-collapse to "Both Meals" once breakfast AND lunch are both Chef's
          // Choice — flips the Both toggle on (same price as 4 + 6).
          if (!isFri && next.breakfast?.mode === 'chef' && next.lunch?.mode === 'chef') {
            delete next.breakfast; delete next.lunch; next.chefBoth = true;
          }
          const hasAny = next.chefBoth || next.breakfast || next.lunch || next.brunch;
          onSetDate(key, hasAny ? next : null);
        };
        const setChef   = (slot) => applyMeal(slot, sel[slot]?.mode === 'chef' ? null : { mode: 'chef' });
        const setCustom = (slot) => applyMeal(slot, sel[slot]?.mode === 'custom' ? null : { mode: 'custom', ...(sel[slot]?.id ? { id: sel[slot].id } : {}) });
        const pickItem  = (slot, id) => {
          const newId = sel[slot]?.id === id ? null : id; // tapping the chosen item clears it
          applyMeal(slot, { mode: 'custom', ...(newId ? { id: newId } : {}) });
        };

        // One meal slot: chef/custom segmented toggle + (when custom) its menu.
        const segStyle = (active, color, tint) => ({
          flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2,
          padding:'10px 6px', borderRadius:10, cursor:'pointer', touchAction:'manipulation',
          transition:'all 150ms', border:`2px solid ${active ? color : '#E5E7EB'}`, background: active ? tint : '#fff',
        });
        const renderSlot = (slot, label, accent, tint, chefRate, items) => {
          const m        = sel[slot];
          // Weekday "Both Meals" locks breakfast+lunch; a breakfast-/lunch-only plan
          // locks Friday brunch — it's bundled as Chef's Choice with no per-day choice.
          const locked   = (!isFri && !!sel.chefBoth) || (isFri && slot === 'brunch' && lockFriBrunch);
          const isChef   = m?.mode === 'chef' || locked; // Both / bundled brunch → show chef as picked
          const isCustom = m?.mode === 'custom' && !locked;
          return (
            <div style={{ marginBottom:14, opacity: locked ? 0.4 : 1, pointerEvents: locked ? 'none' : 'auto' }}>
              <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:700, color:'#374151' }}>{label}</p>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setChef(slot)} aria-pressed={isChef} style={segStyle(isChef, '#1B5E20', '#F0FDF4')}>
                  <span style={{ fontSize:13, fontWeight:700, color: isChef ? '#1B5E20' : '#111827' }}>{t('order.chefsChoice')}</span>
                  <span style={{ fontSize:11, fontWeight:600, color: isChef ? '#1B5E20' : '#6B7280', fontVariantNumeric:'tabular-nums' }}>{fmt(chefRate)}</span>
                </button>
                <button onClick={() => setCustom(slot)} aria-pressed={isCustom} style={segStyle(isCustom, accent, tint)}>
                  <span style={{ fontSize:13, fontWeight:700, color: isCustom ? accent : '#111827' }}>{t('order.illChoose')}</span>
                  <span style={{ fontSize:11, fontWeight:600, color: isCustom ? accent : '#6B7280' }}>{t('order.pickMenu')}</span>
                </button>
              </div>
              {isCustom && (
                <div style={{ marginTop:10 }}>
                  <MealItems items={items} selected={m.id} accentColor={accent} onSelect={id => pickItem(slot, id)} />
                </div>
              )}
            </div>
          );
        };

        return (
          <div role="dialog" aria-modal="true" onClick={close} style={S.sheetOverlay}>
            <div onClick={e => e.stopPropagation()} style={S.sheet}>

              {/* Grab handle + sticky header */}
              <div style={S.sheetHead}>
                <div style={S.sheetGrip} />
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                  <div style={{ minWidth:0 }}>
                    <p style={{ margin:0, fontWeight:700, fontSize:16, color:'#111827' }}>
                      {fmtFullDate(lang, openDate, false)}
                    </p>
                    {isFri && <span style={{ fontSize:11, background:'#F1F8E9', color:'#558B2F', padding:'1px 7px', borderRadius:10, fontWeight:600 }}>{t('order.brunchOnly')}</span>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    {anySel && !(isFri && lockFriBrunch) && (
                      <button onClick={clear} style={{ fontSize:13, color:'#9CA3AF', background:'none', border:'none', cursor:'pointer', padding:'4px 2px' }}>
                        {t('common.clear')}
                      </button>
                    )}
                    <button onClick={close} aria-label={t('common.close')} style={S.sheetClose}>
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
                      <p style={{ margin:0, fontSize:13, fontWeight:700, color:hAccent }}>{t('order.schoolHoliday', { name: holiday.name })}</p>
                      <p style={{ margin:'2px 0 0', fontSize:12, color:'#6B7280', lineHeight:1.45 }}>{t('order.noClasses')}</p>
                    </div>
                  </div>
                )}

                {/* Chef's Choice — Both Meals (weekdays only): one tap covers
                    breakfast + lunch and locks out per-meal "I'll Choose". */}
                {!isFri && (
                  <>
                    <button onClick={toggleBoth} aria-pressed={!!sel.chefBoth} style={{
                      display:'flex', alignItems:'center', gap:12, width:'100%', textAlign:'left',
                      padding:'14px', borderRadius:12, cursor:'pointer', touchAction:'manipulation', transition:'all 150ms',
                      border:`2px solid ${sel.chefBoth ? '#1B5E20' : '#E5E7EB'}`,
                      background: sel.chefBoth ? 'linear-gradient(135deg,#1B5E20 0%,#145A32 100%)' : '#fff',
                    }}>
                      <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                        background: sel.chefBoth ? 'rgba(255,255,255,0.18)' : '#F0FDF4' }}>
                        <svg width="22" height="22" fill="none" stroke={sel.chefBoth ? '#fff' : '#1B5E20'} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3l1.5 3L10 7.5 6.5 9 5 12 3.5 9 0 7.5 3.5 6 5 3zM18 9l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zM13 14l.9 1.8L16 16.7l-1.9.9L13 19.5l-.9-1.9L10 16.7l1.9-.9L13 14z" /></svg>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <span style={{ fontWeight:700, fontSize:15, color: sel.chefBoth ? '#fff' : '#111827' }}>{t('order.chefBothName')}</span>
                        <p style={{ margin:'3px 0 0', fontSize:12, color: sel.chefBoth ? 'rgba(255,255,255,0.85)' : '#6B7280', lineHeight:1.4 }}>
                          {t('order.chefBothDesc', { price: fmt(CHEFS_PRICE.chefs_both) })}
                        </p>
                      </div>
                      <span style={{ flexShrink:0, width:44, height:26, borderRadius:20, padding:2, display:'flex', alignItems:'center',
                        justifyContent: sel.chefBoth ? 'flex-end' : 'flex-start',
                        background: sel.chefBoth ? 'rgba(255,255,255,0.35)' : '#E5E7EB', transition:'all 150ms' }}>
                        <span style={{ width:22, height:22, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                      </span>
                    </button>

                    {sel.chefBoth ? (
                      <p style={{ fontSize:11, color:'#1B5E20', margin:'8px 2px 14px', lineHeight:1.4 }}>{t('order.chefBothLocked')}</p>
                    ) : (
                      <div style={{ display:'flex', alignItems:'center', gap:10, margin:'14px 0' }}>
                        <span style={{ flex:1, height:1, background:'#F3F4F6' }} />
                        <span style={{ fontSize:11, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.04em' }}>{t('order.orPerMeal')}</span>
                        <span style={{ flex:1, height:1, background:'#F3F4F6' }} />
                      </div>
                    )}
                  </>
                )}

                {/* Per-meal chef/custom rows — breakfast + lunch (weekdays) or brunch (Fri) */}
                {isFri ? (
                  <>
                    {renderSlot('brunch', t('meal.brunch'), '#558B2F', '#F1F8E9', CHEFS_BRUNCH, dayM?.brunch || [])}
                    {lockFriBrunch && (
                      <p style={{ fontSize:11, color:'#558B2F', margin:'-4px 2px 0', lineHeight:1.4 }}>{t('order.friBrunchLocked')}</p>
                    )}
                  </>
                ) : (
                  <>
                    {renderSlot('breakfast', t('meal.breakfast'), '#D97706', '#FFF7ED', CHEFS_PRICE.chefs_bf, dayM?.breakfast || [])}
                    {renderSlot('lunch', t('meal.lunch'), '#2563EB', '#EFF6FF', CHEFS_PRICE.chefs_ln, dayM?.lunch || [])}
                    {!sel.chefBoth && sel.breakfast?.mode === 'custom' && sel.breakfast?.id && sel.lunch?.mode === 'custom' && sel.lunch?.id && (
                      <p style={{ fontSize:11, color:'#16A34A', fontWeight:600, margin:'-4px 0 0' }}>
                        {t('order.combo')}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Sticky footer — selections auto-save, Done just closes */}
              <div style={S.sheetFoot}>
                <button onClick={close} style={S.sheetDone}>
                  {hasSel ? t('common.done') : t('common.close')}
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
      {title && <p style={{ margin:'0 0 7px', fontSize:12, fontWeight:600, color:'#374151' }}>{title}</p>}
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
