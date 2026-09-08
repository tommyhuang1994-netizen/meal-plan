'use client';

// What the vendor invoices the school for a month: meals cooked, at cost.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MONTHS, DEFAULT_MONTH, monthLabel, servingDays, getOrdersForDate } from '../../../lib/orderStore';
import { monthlyBill, chefSplit } from '../../../lib/billing';
import { rowCharges } from '../../../lib/pricing';
import { useT, fmtDateInMonth } from '../../../lib/i18n';

const fmtRM = (n) => `RM ${Number(n || 0).toFixed(2)}`;

export default function VendorBillingPage() {
  const router = useRouter();
  const { t, lang } = useT();

  const [monthKey, setMonthKey] = useState(DEFAULT_MONTH);
  const [bill, setBill]   = useState(null);
  const [split, setSplit] = useState(null);
  const [days, setDays]   = useState([]);

  useEffect(() => {
    setBill(monthlyBill(monthKey));
    setSplit(chefSplit(monthKey));
    // Day-by-day cost, so the school can check the invoice against a date.
    setDays(servingDays(monthKey).map(day => {
      const orders = getOrdersForDate(monthKey, day);
      let vendor = 0, meals = 0;
      for (const o of orders) {
        vendor += rowCharges(o).vendor;
        for (const s of ['breakfast', 'lunch', 'brunch']) if (o[s]) meals++;
      }
      return { day, orders: orders.length, meals, vendor };
    }));
  }, [monthKey]);

  return (
    <main style={{ background:'#FAFAFA', minHeight:'100dvh' }}>
      <header style={{ background:'#1B5E20', padding:'14px 20px', paddingRight:108, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Image src="/logo.png" alt="Zera" width={140} height={40} style={{ objectFit:'contain', filter:'brightness(0) invert(1)' }} />
        <button onClick={() => router.push('/vendor/dashboard')}
          style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', borderRadius:8, padding:'7px 14px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          {t('billing.backToOrders')}
        </button>
      </header>

      <div style={{ maxWidth:820, margin:'0 auto', padding:'20px 16px 60px', display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <h1 style={{ margin:0, fontSize:21, fontWeight:700, color:'#111827' }}>{t('billing.vendorTitle')}</h1>
          <p style={{ margin:'3px 0 0', fontSize:13, color:'#6B7280' }}>{t('billing.vendorSubtitle')}</p>
        </div>

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
        ) : bill.orderedDays === 0 ? (
          <div style={S.empty}>{t('billing.noOrders')}</div>
        ) : (
          <>
            <div style={{ background:'#1565C0', color:'#fff', borderRadius:14, padding:'18px 20px' }}>
              <p style={{ margin:0, fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', opacity:0.75 }}>
                {t('billing.toChargeSchool')}
              </p>
              <p style={{ margin:'6px 0 0', fontSize:32, fontWeight:800, fontVariantNumeric:'tabular-nums', lineHeight:1.1 }}>
                {fmtRM(bill.vendorTotal)}
              </p>
              <p style={{ margin:'6px 0 0', fontSize:12.5, opacity:0.85 }}>
                {t('billing.mealsOverDays', { meals: bill.mealsCooked, days: days.length })}
              </p>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
              <div style={S.stat}>
                <p style={S.statLabel}>{t('meal.breakfast')}</p>
                <p style={S.statValue}>{bill.byMeal.breakfast}</p>
              </div>
              <div style={S.stat}>
                <p style={S.statLabel}>{t('meal.lunch')}</p>
                <p style={S.statValue}>{bill.byMeal.lunch}</p>
              </div>
              <div style={S.stat}>
                <p style={S.statLabel}>{t('meal.brunch')}</p>
                <p style={S.statValue}>{bill.byMeal.brunch}</p>
              </div>
            </div>

            {split && (
              <div style={S.card}>
                <p style={S.cardTitle}>{t('billing.kitchenSplit')}</p>
                <div style={S.line}>
                  <span style={{ fontSize:13 }}>{t('order.chefsChoice')}</span>
                  <span style={{ marginLeft:'auto', fontSize:14, fontWeight:700, fontVariantNumeric:'tabular-nums' }}>{split.chef}</span>
                </div>
                <div style={{ ...S.line, borderBottom:'none' }}>
                  <span style={{ fontSize:13 }}>{t('billing.pickedDishes')}</span>
                  <span style={{ marginLeft:'auto', fontSize:14, fontWeight:700, fontVariantNumeric:'tabular-nums' }}>{split.chosen}</span>
                </div>
              </div>
            )}

            <div style={S.card}>
              <p style={S.cardTitle}>{t('billing.byDate')}</p>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr>
                      <th style={S.th}>{t('billing.date')}</th>
                      <th style={{ ...S.th, textAlign:'right' }}>{t('billing.students')}</th>
                      <th style={{ ...S.th, textAlign:'right' }}>{t('billing.meals')}</th>
                      <th style={{ ...S.th, textAlign:'right' }}>{t('billing.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {days.map(d => (
                      <tr key={d.day}>
                        <td style={S.td}>{fmtDateInMonth(lang, monthKey, d.day, false)}</td>
                        <td style={{ ...S.td, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{d.orders}</td>
                        <td style={{ ...S.td, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{d.meals}</td>
                        <td style={{ ...S.td, textAlign:'right', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{fmtRM(d.vendor)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ ...S.td, fontWeight:800, borderTop:'2px solid #E5E7EB' }} colSpan={3}>{t('billing.total')}</td>
                      <td style={{ ...S.td, textAlign:'right', fontWeight:800, color:'#1565C0', fontSize:15, borderTop:'2px solid #E5E7EB', fontVariantNumeric:'tabular-nums' }}>
                        {fmtRM(bill.vendorTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p style={S.note}>{t('billing.vendorNote')}</p>
          </>
        )}
      </div>
    </main>
  );
}

const S = {
  card:      { background:'#fff', borderRadius:14, border:'1px solid #F3F4F6', padding:'14px 16px' },
  cardTitle: { margin:'0 0 10px', fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.05em' },
  stat:      { background:'#fff', borderRadius:12, border:'1px solid #F3F4F6', padding:'12px 14px', textAlign:'center' },
  statLabel: { margin:0, fontSize:10.5, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.04em' },
  statValue: { margin:'4px 0 0', fontSize:22, fontWeight:800, color:'#111827', fontVariantNumeric:'tabular-nums' },
  line:      { display:'flex', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #F9FAFB' },
  th:        { textAlign:'left', fontSize:10.5, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.04em', padding:'6px 8px', borderBottom:'1px solid #F3F4F6', whiteSpace:'nowrap' },
  td:        { padding:'8px', borderBottom:'1px solid #F9FAFB', whiteSpace:'nowrap' },
  empty:     { background:'#fff', borderRadius:14, border:'1px solid #F3F4F6', padding:'40px 20px', textAlign:'center', color:'#9CA3AF', fontSize:14 },
  note:      { fontSize:11.5, color:'#9CA3AF', lineHeight:1.5, margin:0 },
};
