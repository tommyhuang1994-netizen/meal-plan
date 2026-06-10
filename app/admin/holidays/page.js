'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CLASS_GROUPS, getBlockedDaysList, getHolidayInfo } from '../../../lib/schoolCalendar';
import { useT, fmtFullDate } from '../../../lib/i18n';

// ── Helpers ───────────────────────────────────────────────────────────────────

const YEAR  = 2026;
const MONTH = 5; // June
const GROUPS = Object.values(CLASS_GROUPS);
const GRID_HEADERS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const GROUP_COLORS = {
  Cambridge:  { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', active: '#1565C0' },
  Homeschool: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', active: '#1B5E20' },
  Plus:       { bg: '#F1F8E9', border: '#C5E1A5', text: '#558B2F', active: '#558B2F' },
};

function getDays() {
  const firstDow = new Date(YEAR, MONTH, 1).getDay();
  const blanks   = firstDow === 0 ? 6 : firstDow - 1;
  const cells    = [];
  for (let i = 0; i < blanks; i++) cells.push(null);
  for (let d = 1; d <= 30; d++) cells.push(d);
  return cells;
}

function isWeekend(date) {
  const dow = new Date(YEAR, MONTH, date).getDay();
  return dow === 0 || dow === 6;
}

function dayName(date) {
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(YEAR, MONTH, date).getDay()];
}

function ordinal(n) {
  const s = ['th','st','nd','rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Pre-populate from schoolCalendar data
function initHolidays() {
  const result = {};
  for (const group of GROUPS) {
    result[group] = {};
    for (const h of getBlockedDaysList(group)) {
      result[group][h.date] = { name: h.name, type: h.type };
    }
  }
  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminHolidaysPage() {
  const router = useRouter();
  const { t, lang } = useT();
  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') !== 'true') router.replace('/admin');
  }, []);

  const [activeGroup, setGroup]   = useState('Cambridge');
  const [allHolidays, setAll]     = useState(initHolidays);
  const [selected,    setSelected]= useState(null);
  const [form,        setForm]    = useState({ name: '', type: 'holiday' });
  const [saved,       setSaved]   = useState(false);

  const cells    = getDays();
  const holidays = allHolidays[activeGroup] || {};
  const col      = GROUP_COLORS[activeGroup];

  const holidayList = Object.entries(holidays)
    .map(([d, v]) => ({ date: parseInt(d), ...v }))
    .sort((a, b) => a.date - b.date);

  function toggle(date) {
    if (isWeekend(date)) return;
    if (holidays[date]) {
      removeHoliday(date);
    } else {
      setSelected(date);
      setForm({ name: '', type: 'holiday' });
    }
  }

  function addHoliday() {
    if (!selected) return;
    setAll(prev => ({
      ...prev,
      [activeGroup]: {
        ...prev[activeGroup],
        [selected]: { name: form.name || t('adminHol.defaultName'), type: form.type },
      },
    }));
    setSelected(null);
    flash();
  }

  function removeHoliday(date) {
    setAll(prev => {
      const updated = { ...prev[activeGroup] };
      delete updated[date];
      return { ...prev, [activeGroup]: updated };
    });
    flash();
  }

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  return (
    <main style={{ background: '#FAFAFA', minHeight: '100dvh', paddingBottom: 40 }}>

      <header style={S.header}>
        <Link href="/admin/dashboard" style={S.backLink}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          {t('common.admin')}
        </Link>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={S.headerTitle}>{t('adminHol.title')}</h1>
            <p style={S.headerSub}>{t('adminHol.subtitle')}</p>
          </div>
          {saved && (
            <span style={{ display:'flex', alignItems:'center', gap:5, background:'#DCFCE7', color:'#1B5E20', fontSize:13, fontWeight:600, padding:'6px 12px', borderRadius:20 }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {t('common.saved')}
            </span>
          )}
        </div>
      </header>

      <div style={S.container}>

        {/* Class group tabs */}
        <div style={{ display:'flex', gap:8 }}>
          {GROUPS.map(g => {
            const c = GROUP_COLORS[g];
            const active = activeGroup === g;
            const count  = Object.keys(allHolidays[g] || {}).length;
            return (
              <button key={g} onClick={() => { setGroup(g); setSelected(null); }}
                style={{
                  flex:1, padding:'10px 8px', borderRadius:10, border:`2px solid ${active ? c.active : '#E5E7EB'}`,
                  background: active ? c.bg : '#fff', cursor:'pointer', fontWeight:700, fontSize:13,
                  color: active ? c.active : '#374151', transition:'all 150ms', display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                }}>
                {g}
                <span style={{ fontSize:11, fontWeight:600, color: active ? c.active : '#9CA3AF', background: active ? 'rgba(0,0,0,0.06)' : '#F3F4F6', padding:'1px 7px', borderRadius:10 }}>
                  {t('adminHol.blocked', { n: count })}
                </span>
              </button>
            );
          })}
        </div>

        {/* Info banner */}
        <div style={{ background:'#FEF9C3', border:'1px solid #FDE047', borderRadius:10, padding:'9px 13px', fontSize:12, color:'#854D0E', display:'flex', gap:7, alignItems:'center' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink:0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {t('adminHol.infoBanner', { group: activeGroup })}
        </div>

        {/* Calendar */}
        <div style={{ background:'#fff', borderRadius:14, padding:'16px 18px', border:`1px solid ${col.border}` }}>
          <h2 style={{ fontSize:15, fontWeight:700, color:'#111827', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:col.active, display:'inline-block' }} />
            {t('adminHol.calTitle', { group: activeGroup })}
          </h2>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4, marginBottom:4 }}>
            {GRID_HEADERS.map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700, color: d==='Sat'||d==='Sun' ? '#D1D5DB' : '#6B7280', padding:'2px 0' }}>{t('wd.' + d)}</div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4 }}>
            {cells.map((date, i) => {
              if (!date) return <div key={i} />;
              const weekend  = isWeekend(date);
              const isHol    = !!holidays[date];
              const isPicked = selected === date;
              const hInfo    = holidays[date];
              const isBreak  = hInfo?.type === 'break';

              if (weekend) return (
                <div key={i} style={{ aspectRatio:'1', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:12, color:'#E5E7EB' }}>{date}</span>
                </div>
              );

              return (
                <button key={i} onClick={() => toggle(date)}
                  style={{
                    aspectRatio:'1', borderRadius:9, cursor:'pointer', padding:'2px 1px', overflow:'hidden',
                    border: isPicked ? `2px solid ${col.active}` : isHol ? `1.5px solid ${isBreak ? '#FDE68A' : '#FECACA'}` : '1.5px solid #F3F4F6',
                    background: isPicked ? col.bg : isHol ? (isBreak ? '#FFFBEB' : '#FFF5F5') : '#fff',
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1,
                    transition:'all 150ms',
                  }}>
                  <span style={{ fontSize:13, fontWeight: isHol || isPicked ? 700 : 500, color: isPicked ? col.active : isHol ? (isBreak ? '#D97706' : '#DC2626') : '#111827', lineHeight:1.1 }}>
                    {date}
                  </span>
                  {isHol && (
                    <span style={{ fontSize:8, fontWeight:600, color: isBreak ? '#D97706' : '#DC2626', lineHeight:1, textAlign:'center', padding:'0 1px', maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {hInfo.type === 'break' ? t('holiday.break') : hInfo.name.split(' ')[0]}
                    </span>
                  )}
                  {isPicked && !isHol && (
                    <svg width="8" height="8" fill="none" stroke={col.active} strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display:'flex', gap:14, marginTop:12, fontSize:11, color:'#9CA3AF', flexWrap:'wrap' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:9, height:9, borderRadius:2, background:'#FFFBEB', border:'1px solid #FDE68A', display:'inline-block' }} /> {t('legend.termBreak')}</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:9, height:9, borderRadius:2, background:'#FFF5F5', border:'1px solid #FECACA', display:'inline-block' }} /> {t('legend.publicHoliday')}</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>{t('legend.clickToToggle')}</span>
          </div>
        </div>

        {/* Add holiday form */}
        {selected && !holidays[selected] && (
          <div style={{ background:'#fff', borderRadius:12, padding:'16px', border:`2px solid ${col.active}` }}>
            <p style={{ fontSize:14, fontWeight:700, color:'#111827', margin:'0 0 12px' }}>
              {t('adminHol.blockFor', { date: fmtFullDate(lang, selected), group: activeGroup })}
            </p>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <button onClick={() => setForm(f => ({ ...f, type:'holiday' }))}
                style={{ flex:1, padding:'8px', borderRadius:8, border:`2px solid ${form.type==='holiday' ? '#DC2626' : '#E5E7EB'}`, background: form.type==='holiday' ? '#FFF5F5' : '#fff', fontWeight:600, fontSize:13, color: form.type==='holiday' ? '#DC2626' : '#374151', cursor:'pointer' }}>
                {t('adminHol.publicHoliday')}
              </button>
              <button onClick={() => setForm(f => ({ ...f, type:'break' }))}
                style={{ flex:1, padding:'8px', borderRadius:8, border:`2px solid ${form.type==='break' ? '#D97706' : '#E5E7EB'}`, background: form.type==='break' ? '#FFFBEB' : '#fff', fontWeight:600, fontSize:13, color: form.type==='break' ? '#D97706' : '#374151', cursor:'pointer' }}>
                {t('adminHol.termBreak')}
              </button>
            </div>
            <label style={S.inputLabel}>{t('adminHol.holidayName')}</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={form.type === 'break' ? t('adminHol.phBreak') : t('adminHol.phHoliday')}
              style={{ ...S.input, marginBottom:12 }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={addHoliday}
                style={{ flex:1, background: col.active, color:'#fff', border:'none', borderRadius:9, padding:'11px 0', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                {t('adminHol.blockThisDay')}
              </button>
              <button onClick={() => setSelected(null)}
                style={{ padding:'11px 16px', background:'#F3F4F6', border:'none', borderRadius:9, fontSize:14, fontWeight:600, color:'#374151', cursor:'pointer' }}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Holiday list */}
        <div style={{ background:'#fff', borderRadius:12, padding:'16px', border:'1px solid #F3F4F6' }}>
          <h2 style={{ fontSize:15, fontWeight:700, color:'#111827', margin:'0 0 12px', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:9, height:9, borderRadius:'50%', background:col.active, display:'inline-block' }} />
            {t('adminHol.blockedDays', { group: activeGroup })}
            <span style={{ fontSize:13, fontWeight:500, color:'#9CA3AF' }}>{t(holidayList.length !== 1 ? 'adminHol.days' : 'adminHol.day', { n: holidayList.length })}</span>
          </h2>

          {holidayList.length === 0 ? (
            <p style={{ fontSize:13, color:'#9CA3AF', textAlign:'center', padding:'16px 0' }}>{t('adminHol.noBlocked')}</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {holidayList.map(({ date, name, type }) => {
                const isBreak = type === 'break';
                return (
                  <div key={date} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background: isBreak ? '#FFFBEB' : '#FFF5F5', borderRadius:9, border:`1px solid ${isBreak ? '#FDE68A' : '#FEE2E2'}` }}>
                    <div style={{ width:38, height:38, borderRadius:8, background: isBreak ? '#FEF3C7' : '#FEE2E2', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:15, fontWeight:800, color: isBreak ? '#D97706' : '#DC2626', lineHeight:1 }}>{date}</span>
                      <span style={{ fontSize:9, color: isBreak ? '#D97706' : '#DC2626', fontWeight:600, textTransform:'uppercase' }}>{t('adminHol.jun')}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0, fontWeight:600, fontSize:14, color:'#111827' }}>{name}</p>
                      <p style={{ margin:'2px 0 0', fontSize:12, color:'#9CA3AF' }}>
                        {fmtFullDate(lang, date)}
                        · <span style={{ color: isBreak ? '#D97706' : '#DC2626', fontWeight:600 }}>{isBreak ? t('adminHol.termBreak') : t('adminHol.publicHoliday')}</span>
                      </p>
                    </div>
                    <button onClick={() => removeHoliday(date)} title={t('common.remove')}
                      style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:'#9CA3AF', display:'flex', alignItems:'center' }}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

const S = {
  header:      { background:'#fff', borderBottom:'1px solid #F3F4F6', padding:'16px 20px 20px', display:'flex', flexDirection:'column', gap:10 },
  backLink:    { display:'inline-flex', alignItems:'center', gap:4, color:'#6B7280', textDecoration:'none', fontSize:13, fontWeight:500 },
  headerTitle: { fontSize:22, fontWeight:700, color:'#111827', margin:0 },
  headerSub:   { fontSize:13, color:'#6B7280', margin:0 },
  container:   { maxWidth:640, margin:'0 auto', padding:'20px 16px', display:'flex', flexDirection:'column', gap:16 },
  inputLabel:  { display:'block', fontSize:11, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:5 },
  input:       { width:'100%', padding:'9px 12px', borderRadius:9, border:'1.5px solid #E5E7EB', fontSize:14, outline:'none', boxSizing:'border-box' },
};
