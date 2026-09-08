'use client';

// The popup a parent gets from "Change" on one day of a placed order. Shows
// that date's menu and lets them swap the meals for that day only.
//
// Pricing comes from lib/pricing.js, the same module the order page uses, so a
// day costs the same wherever it is edited.

import { useState } from 'react';
import { MENU_BY_DATE, isFridayDate } from '../../lib/menuData';
import { CHEFS_PRICE, CHEFS_BRUNCH, fmt, isDatePicked, priceForDate } from '../../lib/pricing';
import { useT, fmtDateInMonth } from '../../lib/i18n';

export default function DayMenuSheet({ iso, monthKey, sel: initialSel, onSave, onClose }) {
  const { t, lang } = useT();
  const [sel, setSel] = useState(initialSel ?? {});

  const dayNum = parseInt(iso.slice(8), 10);
  const isFri  = isFridayDate(dayNum);
  const menu   = MENU_BY_DATE[iso] ?? {};
  const { price, discount } = priceForDate(iso, sel);
  const dayTotal = price - discount;

  const setChef   = (slot) => setSel(s => ({ ...s, chefBoth: false, [slot]: { mode: 'chef' } }));
  const setCustom = (slot) => setSel(s => ({ ...s, chefBoth: false, [slot]: { mode: 'custom', id: s[slot]?.id ?? null } }));
  const pickItem  = (slot, id) => setSel(s => ({ ...s, chefBoth: false, [slot]: { mode: 'custom', id } }));
  const clearSlot = (slot) => setSel(s => { const n = { ...s }; delete n[slot]; return n; });
  const toggleBoth = () => setSel(s => s.chefBoth
    ? {}
    : { chefBoth: true, breakfast: undefined, lunch: undefined });

  function renderSlot(slot, label, accent, tint, chefRate, items) {
    const m        = sel[slot];
    const locked   = !isFri && !!sel.chefBoth;      // the pair covers both meals
    const isChef   = m?.mode === 'chef' || locked;
    const isCustom = m?.mode === 'custom' && !locked;
    return (
      <div style={{ marginBottom: 14, opacity: locked ? 0.4 : 1, pointerEvents: locked ? 'none' : 'auto' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:8 }}>
          <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#374151' }}>{label}</p>
          {!locked && (isChef || isCustom) && (
            <button onClick={() => clearSlot(slot)}
              style={{ background:'none', border:'none', padding:0, cursor:'pointer', fontSize:12, color:'#9CA3AF' }}>
              {t('common.remove')}
            </button>
          )}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setChef(slot)} aria-pressed={isChef} style={seg(isChef, '#1B5E20', '#F0FDF4')}>
            <span style={{ fontSize:13, fontWeight:700, color: isChef ? '#1B5E20' : '#111827' }}>{t('order.chefsChoice')}</span>
            <span style={{ fontSize:11, fontWeight:600, color: isChef ? '#1B5E20' : '#6B7280' }}>{fmt(chefRate)}</span>
          </button>
          <button onClick={() => setCustom(slot)} aria-pressed={isCustom} style={seg(isCustom, accent, tint)}>
            <span style={{ fontSize:13, fontWeight:700, color: isCustom ? accent : '#111827' }}>{t('order.illChoose')}</span>
            <span style={{ fontSize:11, fontWeight:600, color: isCustom ? accent : '#6B7280' }}>{t('order.pickMenu')}</span>
          </button>
        </div>
        {isCustom && (
          <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:6 }}>
            {items.map(item => {
              const on = m?.id === item.id;
              return (
                <button key={item.id} onClick={() => pickItem(slot, item.id)} aria-pressed={on}
                  style={{ display:'flex', alignItems:'center', gap:10, width:'100%', textAlign:'left',
                    background:'#fff', border:`1.5px solid ${on ? accent : '#E5E7EB'}`, borderRadius:10,
                    padding:'10px 12px', cursor:'pointer' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:13, fontWeight: on ? 600 : 500, color:'#111827' }}>{item.name}</p>
                    {item.desc && <p style={{ margin:'2px 0 0', fontSize:11, color:'#9CA3AF' }}>{item.desc}</p>}
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color: on ? accent : '#374151' }}>{fmt(item.price)}</span>
                  <span style={{ width:18, height:18, borderRadius:'50%', flexShrink:0,
                    border:`2px solid ${on ? accent : '#D1D5DB'}`, background: on ? accent : 'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {on && <svg width="9" height="9" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={head}>
          <div style={grip} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
            <p style={{ margin:0, fontWeight:700, fontSize:16, color:'#111827' }}>
              {fmtDateInMonth(lang, monthKey, dayNum, false)}
            </p>
            <button onClick={onClose} aria-label={t('common.close')} style={closeBtn}>
              <svg width="16" height="16" fill="none" stroke="#6B7280" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div style={body}>
          {!isFri && (
            <button onClick={toggleBoth} aria-pressed={!!sel.chefBoth} style={{
              display:'flex', alignItems:'center', gap:12, width:'100%', textAlign:'left',
              padding:14, borderRadius:12, cursor:'pointer', marginBottom:14,
              border:`2px solid ${sel.chefBoth ? '#1B5E20' : '#E5E7EB'}`,
              background: sel.chefBoth ? '#F0FDF4' : '#fff',
            }}>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#111827' }}>{t('order.chefBothName')}</p>
                <p style={{ margin:'2px 0 0', fontSize:12, color:'#6B7280' }}>
                  {t('order.chefBothDesc', { price: fmt(CHEFS_PRICE.chefs_both) })}
                </p>
              </div>
              <span style={{ width:22, height:22, borderRadius:'50%', flexShrink:0,
                border:`2px solid ${sel.chefBoth ? '#1B5E20' : '#D1D5DB'}`, background: sel.chefBoth ? '#1B5E20' : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                {sel.chefBoth && <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </span>
            </button>
          )}

          {isFri
            ? renderSlot('brunch', t('meal.brunch'), '#558B2F', '#F1F8E9', CHEFS_BRUNCH, menu.brunch ?? [])
            : (<>
                {renderSlot('breakfast', t('meal.breakfast'), '#D97706', '#FFF7ED', CHEFS_PRICE.chefs_bf, menu.breakfast ?? [])}
                {renderSlot('lunch',     t('meal.lunch'),     '#2563EB', '#EFF6FF', CHEFS_PRICE.chefs_ln, menu.lunch ?? [])}
              </>)}
        </div>

        <div style={foot}>
          <div>
            <p style={{ margin:0, fontSize:11, color:'#6B7280' }}>{t('parent.dayTotal')}</p>
            <p style={{ margin:0, fontSize:20, fontWeight:800, color:'#1B5E20', fontVariantNumeric:'tabular-nums' }}>{fmt(dayTotal)}</p>
          </div>
          <button onClick={() => onSave(sel)} disabled={!isDatePicked(sel)}
            style={{ border:'none', borderRadius:10, padding:'12px 22px', fontSize:15, fontWeight:700,
              cursor: isDatePicked(sel) ? 'pointer' : 'not-allowed',
              background: isDatePicked(sel) ? '#1B5E20' : '#A5C8A8', color:'#fff' }}>
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

const seg = (active, accent, tint) => ({
  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  padding: '9px 6px', borderRadius: 10, cursor: 'pointer',
  border: `1.5px solid ${active ? accent : '#E5E7EB'}`,
  background: active ? tint : '#fff',
});

const overlay = {
  position:'fixed', inset:0, background:'rgba(17,24,39,0.45)', zIndex:50,
  display:'flex', alignItems:'flex-end', justifyContent:'center',
};
const sheet = {
  background:'#fff', width:'100%', maxWidth:520, maxHeight:'88dvh',
  borderRadius:'18px 18px 0 0', display:'flex', flexDirection:'column', overflow:'hidden',
};
const head = { padding:'8px 16px 12px', borderBottom:'1px solid #F3F4F6', flexShrink:0 };
const grip = { width:38, height:4, borderRadius:2, background:'#E5E7EB', margin:'0 auto 10px' };
const body = { padding:'14px 16px', overflowY:'auto', flex:1 };
const foot = {
  padding:'12px 16px calc(12px + env(safe-area-inset-bottom))', borderTop:'1px solid #F3F4F6',
  display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexShrink:0, background:'#fff',
};
const closeBtn = {
  width:30, height:30, borderRadius:'50%', border:'none', background:'#F3F4F6',
  display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0,
};
