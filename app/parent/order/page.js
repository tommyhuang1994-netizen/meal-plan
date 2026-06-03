'use client';

import { useState } from 'react';
import Link from 'next/link';

// ── Constants ─────────────────────────────────────────────────────────────────

const KIDS = ['Ahmad Irfan', 'Nur Aisyah'];
const COMBO_DISCOUNT = 1.00;
const WEEKDAY_COUNT = { Mon: 4, Tue: 4, Wed: 5, Thu: 4, Fri: 4 };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_LABELS = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday' };

const MENU = {
  Mon: {
    breakfast: [
      { id: 'b-mon-1', name: 'Nasi Lemak', desc: 'Coconut rice, egg, sambal', price: 3.50 },
      { id: 'b-mon-2', name: 'Roti Canai', desc: 'Flaky flatbread with dhal', price: 3.00 },
    ],
    lunch: [
      { id: 'l-mon-1', name: 'Chicken Rice', desc: 'Steamed chicken, fragrant rice, soup', price: 5.50 },
      { id: 'l-mon-2', name: 'Mee Goreng', desc: 'Fried noodles with vegetables & egg', price: 5.00 },
      { id: 'l-mon-3', name: 'Economy Rice', desc: 'Rice with 2 lauk choices', price: 5.50 },
    ],
  },
  Tue: {
    breakfast: [
      { id: 'b-tue-1', name: 'Nasi Goreng', desc: 'Fried rice with egg & vegetables', price: 4.00 },
      { id: 'b-tue-2', name: 'Sandwich Set', desc: 'Egg mayo sandwich & milo', price: 4.50 },
    ],
    lunch: [
      { id: 'l-tue-1', name: 'Pasta Bolognese', desc: 'Spaghetti with meat sauce', price: 6.00 },
      { id: 'l-tue-2', name: 'Nasi Campur', desc: 'Mixed rice with 3 side dishes', price: 6.50 },
    ],
  },
  Wed: {
    breakfast: [
      { id: 'b-wed-1', name: 'Mihun Soup', desc: 'Vermicelli in clear chicken broth', price: 3.50 },
      { id: 'b-wed-2', name: 'Bread & Butter', desc: 'Toast with kaya & butter, milo', price: 3.00 },
      { id: 'b-wed-3', name: 'Nasi Lemak', desc: 'Coconut rice, egg, sambal', price: 3.50 },
    ],
    lunch: [
      { id: 'l-wed-1', name: 'Chicken Chop', desc: 'Grilled chicken, fries, coleslaw', price: 7.00 },
      { id: 'l-wed-2', name: 'Fried Rice Set', desc: 'Fried rice with chicken & soup', price: 5.50 },
    ],
  },
  Thu: {
    breakfast: [
      { id: 'b-thu-1', name: 'Chapati Set', desc: 'Chapati with curry & dhal', price: 4.00 },
      { id: 'b-thu-2', name: 'Mee Soup', desc: 'Noodles in chicken soup', price: 3.50 },
    ],
    lunch: [
      { id: 'l-thu-1', name: 'Nasi Ayam Penyet', desc: 'Smashed fried chicken, sambal, rice', price: 6.50 },
      { id: 'l-thu-2', name: 'Mee Mamak', desc: 'Spicy fried noodles Indian style', price: 5.50 },
      { id: 'l-thu-3', name: 'Nasi Goreng USA', desc: 'Fried rice with chicken & egg', price: 6.00 },
    ],
  },
  Fri: {
    breakfast: [
      { id: 'b-fri-1', name: 'Roti Telur', desc: 'Egg flatbread with curry', price: 4.00 },
      { id: 'b-fri-2', name: 'Oat Porridge', desc: 'Warm oats with fruits', price: 3.50 },
    ],
    lunch: [
      { id: 'l-fri-1', name: 'Fish & Chips', desc: 'Battered fish fillet, fries, tartar', price: 7.00 },
      { id: 'l-fri-2', name: 'Nasi Biryani', desc: 'Fragrant basmati with chicken', price: 6.50 },
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) { return `RM ${n.toFixed(2)}`; }

const initChild = () => ({ bfEnabled: true, lnEnabled: true, selections: {} });

function calcChild(data) {
  const { bfEnabled, lnEnabled, selections } = data;
  let totalBf = 0, totalLn = 0, totalDiscount = 0;
  for (const day of DAYS) {
    const d = selections[day] || {};
    const bfItem = bfEnabled && d.breakfast ? MENU[day].breakfast.find(x => x.id === d.breakfast) : null;
    const lnItem = lnEnabled && d.lunch    ? MENU[day].lunch.find(x => x.id === d.lunch)          : null;
    const count = WEEKDAY_COUNT[day];
    totalBf += bfItem ? bfItem.price * count : 0;
    totalLn += lnItem ? lnItem.price * count : 0;
    if (bfItem && lnItem) totalDiscount += COMBO_DISCOUNT * count;
  }
  const total = totalBf + totalLn - totalDiscount;
  const bfMissing = bfEnabled ? DAYS.filter(d => !(selections[d]?.breakfast)).length : 0;
  const lnMissing = lnEnabled ? DAYS.filter(d => !(selections[d]?.lunch)).length : 0;
  const isComplete = (bfEnabled || lnEnabled) && bfMissing === 0 && lnMissing === 0;
  const hasAny = totalBf > 0 || totalLn > 0;
  return { totalBf, totalLn, totalDiscount, total, bfMissing, lnMissing, isComplete, hasAny };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlaceOrderPage() {
  const [activeChild, setActiveChild] = useState(KIDS[0]);
  const [childData, setChildData] = useState(
    Object.fromEntries(KIDS.map(k => [k, initChild()]))
  );
  const [submitted, setSubmitted] = useState(false);

  function updateChild(kid, updater) {
    setChildData(prev => ({ ...prev, [kid]: updater(prev[kid]) }));
  }

  function toggleBf(kid) {
    updateChild(kid, d => ({ ...d, bfEnabled: !d.bfEnabled }));
  }
  function toggleLn(kid) {
    updateChild(kid, d => ({ ...d, lnEnabled: !d.lnEnabled }));
  }
  function selectMeal(kid, day, type, id) {
    updateChild(kid, d => ({
      ...d,
      selections: {
        ...d.selections,
        [day]: { ...(d.selections[day] || {}), [type]: id },
      },
    }));
  }

  // Grand total across all kids
  const allCalcs = Object.fromEntries(KIDS.map(k => [k, calcChild(childData[k])]));
  const grandTotal = KIDS.reduce((s, k) => s + allCalcs[k].total, 0);
  const allComplete = KIDS.every(k => allCalcs[k].isComplete);
  const anyStarted  = KIDS.some(k => allCalcs[k].hasAny);

  const canSubmit = allComplete;

  function handleSubmit() {
    if (!canSubmit) return;
    setSubmitted(true);
  }

  // ── Submitted ─────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <main style={{ background: '#FAFAFA', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '40px 28px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
          <div style={{ width: 56, height: 56, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="26" height="26" fill="none" stroke="#16A34A" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Order Submitted!</h2>
          {KIDS.map(k => (
            <p key={k} style={{ color: '#6B7280', fontSize: 14, margin: '0 0 4px' }}>
              <strong>{k}</strong>: {fmt(allCalcs[k].total)}
            </p>
          ))}
          <p style={{ color: '#111827', fontWeight: 700, fontSize: 16, margin: '12px 0 28px' }}>
            Total: {fmt(grandTotal)}
          </p>
          <Link href="/parent" style={{ display: 'block', background: '#DC2626', color: '#fff', padding: '13px 0', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            Back to My Orders
          </Link>
        </div>
      </main>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────────────

  return (
    <main style={{ background: '#FAFAFA', minHeight: '100dvh', paddingBottom: 130 }}>

      <header style={S.header}>
        <Link href="/parent" style={S.backLink}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <h1 style={S.headerTitle}>Place Order</h1>
        <p style={S.headerSub}>June 2026 · Same menu repeats every same weekday</p>
      </header>

      <div style={S.container}>
        <p style={S.topHint}>Configure meals for each child. Combo (breakfast + lunch): <strong>−RM 1.00/day</strong>.</p>

        {KIDS.map(kid => {
          const data = childData[kid];
          const calc = allCalcs[kid];
          const isOpen = activeChild === kid;

          return (
            <ChildCard
              key={kid}
              kid={kid}
              data={data}
              calc={calc}
              isOpen={isOpen}
              onToggleOpen={() => setActiveChild(isOpen ? null : kid)}
              onToggleBf={() => toggleBf(kid)}
              onToggleLn={() => toggleLn(kid)}
              onSelectMeal={(day, type, id) => selectMeal(kid, day, type, id)}
            />
          );
        })}
      </div>

      {/* Sticky summary */}
      <div style={S.stickyBottom}>
        <div style={S.summaryContainer}>
          {anyStarted && (
            <div style={S.priceRow}>
              {KIDS.map(k => allCalcs[k].hasAny && (
                <span key={k} style={S.priceChip}>
                  <svg width="11" height="11" fill="none" stroke="#6B7280" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  {k.split(' ')[0]}: {fmt(allCalcs[k].total)}
                </span>
              ))}
            </div>
          )}
          <div style={S.submitRow}>
            <div>
              <p style={S.totalLabel}>Grand Total</p>
              <p style={S.totalAmount}>{fmt(grandTotal)}</p>
            </div>
            <button onClick={handleSubmit} disabled={!canSubmit}
              style={{ ...S.submitBtn, opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
              Confirm Order
            </button>
          </div>
          {!canSubmit && (
            <p style={S.submitHint}>
              {KIDS.filter(k => !allCalcs[k].isComplete).map(k => {
                const c = allCalcs[k];
                if (!c.hasAny && !childData[k].bfEnabled && !childData[k].lnEnabled) return `${k.split(' ')[0]}: enable a meal type`;
                if (c.bfMissing > 0) return `${k.split(' ')[0]}: ${c.bfMissing} breakfast day${c.bfMissing > 1 ? 's' : ''} missing`;
                if (c.lnMissing > 0) return `${k.split(' ')[0]}: ${c.lnMissing} lunch day${c.lnMissing > 1 ? 's' : ''} missing`;
                return null;
              }).filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

// ── ChildCard ─────────────────────────────────────────────────────────────────

function ChildCard({ kid, data, calc, isOpen, onToggleOpen, onToggleBf, onToggleLn, onSelectMeal }) {
  const { bfEnabled, lnEnabled, selections } = data;

  let statusLabel, statusStyle;
  if (calc.isComplete) {
    statusLabel = `Ready · ${fmt(calc.total)}`;
    statusStyle = { background: '#DCFCE7', color: '#16A34A' };
  } else if (calc.hasAny || calc.bfMissing < 5 || calc.lnMissing < 5) {
    const missing = calc.bfMissing + calc.lnMissing;
    statusLabel = `${missing} selection${missing !== 1 ? 's' : ''} left`;
    statusStyle = { background: '#FEF9C3', color: '#854D0E' };
  } else {
    statusLabel = 'Not started';
    statusStyle = { background: '#F3F4F6', color: '#6B7280' };
  }

  return (
    <div style={{ background: '#fff', border: `1.5px solid ${isOpen ? '#DC2626' : '#F3F4F6'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 150ms ease' }}>

      {/* Card header — always visible */}
      <button onClick={onToggleOpen} style={S.childHeader} aria-expanded={isOpen}>
        <div style={{ ...S.kidAvatar, background: isOpen ? '#DC2626' : '#F3F4F6' }}>
          <svg width="16" height="16" fill="none" stroke={isOpen ? '#fff' : '#9CA3AF'} strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#111827' }}>{kid}</p>
          <span style={{ ...S.statusBadge, ...statusStyle }}>{statusLabel}</span>
        </div>
        <svg
          width="18" height="18" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease', flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible body */}
      {isOpen && (
        <div style={S.childBody}>

          {/* Meal type toggles */}
          <div style={{ marginBottom: 16 }}>
            <p style={S.bodyLabel}>Include meals</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <MealTypeToggle label="Breakfast" icon={<SunIcon />} enabled={bfEnabled} onToggle={onToggleBf} accentColor="#F97316" />
              <MealTypeToggle label="Lunch"     icon={<ForkIcon />} enabled={lnEnabled} onToggle={onToggleLn} accentColor="#2563EB" />
            </div>
          </div>

          {/* Daily selections */}
          {(bfEnabled || lnEnabled) && (
            <div>
              <p style={S.bodyLabel}>Daily menu — pick one per day</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {DAYS.map(day => {
                  const d = selections[day] || {};
                  const hasCombo = bfEnabled && lnEnabled && d.breakfast && d.lunch;
                  const count = WEEKDAY_COUNT[day];
                  return (
                    <div key={day} style={S.dayCard}>
                      <div style={S.dayHeader}>
                        <div>
                          <span style={S.dayLabel}>{DAY_LABELS[day]}</span>
                          <span style={S.dayCount}>{count}× this month</span>
                        </div>
                        {hasCombo && (
                          <span style={S.comboBadge}>
                            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Combo −{fmt(COMBO_DISCOUNT * count)}
                          </span>
                        )}
                      </div>
                      {bfEnabled && (
                        <MealSection title="Breakfast" icon={<SunIcon />} items={MENU[day].breakfast}
                          selected={d.breakfast} onSelect={id => onSelectMeal(day, 'breakfast', id)} accentColor="#F97316" />
                      )}
                      {lnEnabled && (
                        <MealSection title="Lunch" icon={<ForkIcon />} items={MENU[day].lunch}
                          selected={d.lunch} onSelect={id => onSelectMeal(day, 'lunch', id)} accentColor="#2563EB" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!bfEnabled && !lnEnabled && (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '8px 0 4px' }}>Enable at least one meal type above.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── MealTypeToggle ────────────────────────────────────────────────────────────

function MealTypeToggle({ label, icon, enabled, onToggle, accentColor }) {
  return (
    <button onClick={onToggle} aria-pressed={enabled}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '11px 0', borderRadius: 10, cursor: 'pointer', border: 'none',
        background: enabled ? accentColor : '#F3F4F6',
        color: enabled ? '#fff' : '#9CA3AF',
        fontWeight: 700, fontSize: 14,
        transition: 'background 150ms ease, color 150ms ease',
        touchAction: 'manipulation',
      }}>
      <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      {label}
      {enabled
        ? <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        : <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      }
    </button>
  );
}

// ── MealSection ───────────────────────────────────────────────────────────────

function MealSection({ title, icon, items, selected, onSelect, accentColor }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={S.mealTypeHeader}>
        <span style={{ color: accentColor, display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={S.mealTypeLabel}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(item => {
          const active = selected === item.id;
          return (
            <button key={item.id} onClick={() => onSelect(item.id)} aria-pressed={active}
              style={{ ...S.mealCard, ...(active ? { borderColor: accentColor } : {}) }}>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: active ? 600 : 500, color: '#111827' }}>{item.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9CA3AF', lineHeight: 1.4 }}>{item.desc}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: active ? accentColor : '#374151', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(item.price)}
                </span>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${active ? accentColor : '#D1D5DB'}`,
                  background: active ? accentColor : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'all 150ms ease',
                }}>
                  {active && <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function ForkIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  header: { background: '#fff', borderBottom: '1px solid #F3F4F6', padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: 4, color: '#6B7280', textDecoration: 'none', fontSize: 13, fontWeight: 500 },
  headerTitle: { fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 },
  headerSub: { fontSize: 13, color: '#6B7280', margin: 0 },
  container: { maxWidth: 640, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 },
  topHint: { fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.5 },

  // Child card
  childHeader: {
    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
    padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
    touchAction: 'manipulation',
  },
  kidAvatar: { width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 150ms ease' },
  statusBadge: { display: 'inline-block', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, marginTop: 3 },
  childBody: { padding: '0 16px 16px', borderTop: '1px solid #F9FAFB' },
  bodyLabel: { fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px' },

  // Day card
  dayCard: { background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 10, padding: '12px 12px 14px' },
  dayHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  dayLabel: { fontSize: 14, fontWeight: 700, color: '#111827', marginRight: 6 },
  dayCount: { fontSize: 12, color: '#9CA3AF' },
  comboBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, background: '#DCFCE7', color: '#16A34A', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 },

  mealTypeHeader: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 },
  mealTypeLabel: { fontSize: 12, fontWeight: 600, color: '#374151' },
  mealCard: { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1.5px solid #F3F4F6', borderRadius: 8, padding: '9px 10px', cursor: 'pointer', width: '100%', transition: 'border-color 150ms ease', touchAction: 'manipulation' },

  // Sticky
  stickyBottom: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #F3F4F6', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 100 },
  summaryContainer: { maxWidth: 640, margin: '0 auto', padding: '10px 16px 18px' },
  priceRow: { display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  priceChip: { display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 20, padding: '4px 10px', fontSize: 13, fontWeight: 600, color: '#374151' },
  submitRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  totalLabel: { fontSize: 12, color: '#9CA3AF', margin: 0, fontWeight: 500 },
  totalAmount: { fontSize: 22, fontWeight: 800, color: '#111827', margin: '2px 0 0', fontVariantNumeric: 'tabular-nums' },
  submitBtn: { background: '#DC2626', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 24px', fontSize: 15, fontWeight: 700, transition: 'opacity 150ms ease', whiteSpace: 'nowrap' },
  submitHint: { fontSize: 12, color: '#9CA3AF', margin: '6px 0 0', textAlign: 'center' },
};
