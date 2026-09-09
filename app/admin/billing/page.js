'use client';

// What the school invoices parents for a month, student by student.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MONTHS, DEFAULT_MONTH, monthLabel } from '../../../lib/orderStore';
import { monthlyBill } from '../../../lib/billing';
import { useT } from '../../../lib/i18n';
import { AllergyTags, UnattributedWarning } from '../../AllergyTags';
import { UNATTRIBUTED_ALLERGIES } from '../../../lib/students';

const fmtRM = (n) => `RM ${Number(n || 0).toFixed(2)}`;

const GROUP_COLOR = {
  Cambridge:  { bg: '#EFF6FF', color: '#1D4ED8' },
  Homeschool: { bg: '#F0FDF4', color: '#15803D' },
  Plus:       { bg: '#FDF4FF', color: '#7E22CE' },
  Staff:      { bg: '#FFF7ED', color: '#C2410C' },
};

export default function AdminBillingPage() {
  const router = useRouter();
  const { t, lang } = useT();
  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') !== 'true') router.replace('/admin');
  }, []);

  const [monthKey, setMonthKey] = useState(DEFAULT_MONTH);
  const [bill, setBill] = useState(null);   // localStorage — after mount only

  useEffect(() => { setBill(monthlyBill(monthKey)); }, [monthKey]);

  return (
    <main style={{ background:'#FAFAFA', minHeight:'100dvh', paddingBottom:40 }}>
      <header style={S.header}>
        <Link href="/admin/dashboard" style={S.backLink}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          {t('common.admin')}
        </Link>
        <h1 style={S.headerTitle}>{t('billing.adminTitle')}</h1>
        <p style={S.headerSub}>{t('billing.adminSubtitle')}</p>
      </header>

      <div style={S.container}>
        <div style={{ display:'flex', gap:6 }}>
          {MONTHS.map(m => {
            const on = monthKey === m.key;
            return (
              <button key={m.key} onClick={() => setMonthKey(m.key)} aria-pressed={on}
                style={{ padding:'8px 14px', borderRadius:9, cursor:'pointer', fontSize:13, fontWeight:700,
                  border:`1.5px solid ${on ? '#1B5E20' : '#E5E7EB'}`,
                  background: on ? '#1B5E20' : '#fff', color: on ? '#fff' : '#374151' }}>
                {monthLabel(m.key, lang)}
              </button>
            );
          })}
        </div>

        {!bill ? (
          <p style={{ fontSize:13, color:'#9CA3AF' }}>{t('billing.loading')}</p>
        ) : bill.students.length === 0 ? (
          <div style={S.empty}>{t('billing.noOrders')}</div>
        ) : (
          <>
            {/* Headline: what to bill parents */}
            <div style={{ background:'#1B5E20', color:'#fff', borderRadius:14, padding:'18px 20px' }}>
              <p style={{ margin:0, fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', opacity:0.75 }}>
                {t('billing.toChargeParents')}
              </p>
              <p style={{ margin:'6px 0 0', fontSize:32, fontWeight:800, fontVariantNumeric:'tabular-nums', lineHeight:1.1 }}>
                {fmtRM(bill.parentTotal)}
              </p>
              <p style={{ margin:'6px 0 0', fontSize:12.5, opacity:0.8 }}>
                {t('billing.acrossStudents', { n: bill.students.length, days: bill.orderedDays })}
              </p>
            </div>

            {/* What the school keeps */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div style={S.stat}>
                <p style={S.statLabel}>{t('billing.vendorCost')}</p>
                <p style={{ ...S.statValue, color:'#1565C0' }}>{fmtRM(bill.vendorTotal)}</p>
                <p style={S.statSub}>{t('billing.owedToVendor')}</p>
              </div>
              <div style={S.stat}>
                <p style={S.statLabel}>{t('billing.margin')}</p>
                <p style={{ ...S.statValue, color:'#D97706' }}>{fmtRM(bill.margin)}</p>
                <p style={S.statSub}>
                  {bill.parentTotal > 0 ? `${((bill.margin / bill.parentTotal) * 100).toFixed(1)}%` : '—'}
                </p>
              </div>
            </div>

            {/* Per class group */}
            <div style={S.card}>
              <p style={S.cardTitle}>{t('billing.byGroup')}</p>
              {bill.groups.map(g => {
                const c = GROUP_COLOR[g.dept] ?? { bg:'#F3F4F6', color:'#374151' };
                return (
                  <div key={g.dept} style={S.line}>
                    <span style={{ ...S.chip, background:c.bg, color:c.color }}>{g.dept}</span>
                    <span style={{ fontSize:12, color:'#9CA3AF', marginLeft:8 }}>{t('billing.dayCount', { n: g.days })}</span>
                    <span style={{ marginLeft:'auto', fontSize:14, fontWeight:700, fontVariantNumeric:'tabular-nums' }}>{fmtRM(g.parent)}</span>
                  </div>
                );
              })}
            </div>

            <UnattributedWarning rows={UNATTRIBUTED_ALLERGIES} t={t} />

            {/* Per student — the actual invoice list */}
            <div style={S.card}>
              <p style={S.cardTitle}>
                {t('billing.byStudent')}
                {bill.withAllergies.length > 0 && (
                  <span style={{ marginLeft:8, color:'#B91C1C', fontWeight:700 }}>
                    · {t('allergy.declaredCount', { n: bill.withAllergies.length })}
                  </span>
                )}
              </p>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr>
                      <th style={S.th}>{t('vendor.colName')}</th>
                      <th style={S.th}>{t('vendor.colClass')}</th>
                      <th style={{ ...S.th, textAlign:'right' }}>{t('billing.days')}</th>
                      <th style={{ ...S.th, textAlign:'right' }}>{t('billing.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.students.map(s => (
                      <tr key={s.name}>
                        <td style={S.td}>
                          {s.name}
                          {s.fromParent && <span style={S.viaParent}>{t('billing.viaPortal')}</span>}
                          {(s.allergies?.length || s.note) && (
                            <div style={{ marginTop:3 }}>
                              <AllergyTags allergies={s.allergies} note={s.note} lang={lang} />
                            </div>
                          )}
                        </td>
                        <td style={{ ...S.td, color:'#6B7280' }}>{s.dept}{s.year ? ` ${s.year}` : ''}</td>
                        <td style={{ ...S.td, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{s.days}</td>
                        <td style={{ ...S.td, textAlign:'right', fontWeight:700, fontVariantNumeric:'tabular-nums' }}>{fmtRM(s.parent)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ ...S.td, fontWeight:800, borderTop:'2px solid #E5E7EB' }} colSpan={3}>{t('billing.total')}</td>
                      <td style={{ ...S.td, textAlign:'right', fontWeight:800, color:'#1B5E20', fontSize:15, borderTop:'2px solid #E5E7EB', fontVariantNumeric:'tabular-nums' }}>
                        {fmtRM(bill.parentTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p style={S.note}>{t('billing.adminNote')}</p>
          </>
        )}
      </div>
    </main>
  );
}

const S = {
  header:      { background:'#fff', borderBottom:'1px solid #F3F4F6', padding:'16px 20px 20px', display:'flex', flexDirection:'column', gap:10 },
  backLink:    { display:'inline-flex', alignItems:'center', gap:4, color:'#6B7280', textDecoration:'none', fontSize:13, fontWeight:500 },
  headerTitle: { fontSize:22, fontWeight:700, color:'#111827', margin:0 },
  headerSub:   { fontSize:13, color:'#6B7280', margin:0 },
  container:   { maxWidth:720, margin:'0 auto', padding:'20px 16px', display:'flex', flexDirection:'column', gap:14 },
  card:        { background:'#fff', borderRadius:14, border:'1px solid #F3F4F6', padding:'14px 16px' },
  cardTitle:   { margin:'0 0 10px', fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.05em' },
  stat:        { background:'#fff', borderRadius:12, border:'1px solid #F3F4F6', padding:'13px 14px' },
  statLabel:   { margin:0, fontSize:10.5, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.04em' },
  statValue:   { margin:'5px 0 2px', fontSize:20, fontWeight:800, fontVariantNumeric:'tabular-nums' },
  statSub:     { margin:0, fontSize:11, color:'#9CA3AF' },
  line:        { display:'flex', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #F9FAFB' },
  chip:        { fontSize:11.5, fontWeight:700, padding:'2px 9px', borderRadius:20 },
  th:          { textAlign:'left', fontSize:10.5, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.04em', padding:'6px 8px', borderBottom:'1px solid #F3F4F6', whiteSpace:'nowrap' },
  td:          { padding:'8px', borderBottom:'1px solid #F9FAFB', verticalAlign:'top' },
  viaParent:   { marginLeft:6, fontSize:10, fontWeight:700, color:'#1B5E20', background:'#DCFCE7', borderRadius:10, padding:'1px 6px', whiteSpace:'nowrap' },
  empty:       { background:'#fff', borderRadius:14, border:'1px solid #F3F4F6', padding:'40px 20px', textAlign:'center', color:'#9CA3AF', fontSize:14 },
  note:        { fontSize:11.5, color:'#9CA3AF', lineHeight:1.5, margin:0 },
};
