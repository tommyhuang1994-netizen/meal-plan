'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getParentOrders, getParentOrderDetail, cancelParentOrder,
  monthLabel, CHEF_CHOICE,
} from '../../../lib/orderStore';
import { useT, fmtDateInMonth } from '../../../lib/i18n';
import { isDateLocked } from '../../../lib/cutoff';

const fmtRM = (n) => `RM ${Number(n || 0).toFixed(2)}`;

// The division sometimes already names the group ("Cambridge Plus"); repeating
// it would read as "Cambridge Cambridge Plus".
function classLabel(o) {
  if (!o.division) return o.classGroup;
  return o.division.startsWith(o.classGroup) ? o.division : `${o.classGroup} ${o.division}`;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { t, lang } = useT();
  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') !== 'true') router.replace('/admin');
  }, []);

  // Orders live in localStorage, so they can only be read after mount.
  const [orders,  setOrders]  = useState([]);
  const [openId,  setOpenId]  = useState(null);
  const [detail,  setDetail]  = useState([]);
  const [confirm, setConfirm] = useState(null);   // receipt pending cancellation
  const [notice,  setNotice]  = useState(null);

  const reload = () => setOrders(getParentOrders());
  useEffect(() => { reload(); }, []);
  useEffect(() => {
    if (!openId) { setDetail([]); return; }
    const o = orders.find(x => x.id === openId);
    setDetail(o ? getParentOrderDetail(o.studentName, o.monthKey) : []);
  }, [openId, orders]);

  function doCancel(o) {
    const removed = cancelParentOrder(o.studentName, o.monthKey);
    setConfirm(null);
    setOpenId(null);
    reload();
    setNotice(t('adminOrders.cancelled', { name: o.studentName, n: removed }));
    setTimeout(() => setNotice(null), 4000);
  }

  const total = orders.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <main style={{ background: '#FAFAFA', minHeight: '100dvh', paddingBottom: 40 }}>
      <header style={S.header}>
        <Link href="/admin/dashboard" style={S.backLink}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          {t('common.admin')}
        </Link>
        <h1 style={S.headerTitle}>{t('adminOrders.title')}</h1>
        <p style={S.headerSub}>{t('adminOrders.subtitle')}</p>
      </header>

      <div style={S.container}>
        {notice && (
          <div style={{ background:'#DCFCE7', border:'1px solid #86EFAC', color:'#166534', borderRadius:10, padding:'10px 14px', fontSize:13, fontWeight:600 }}>
            {notice}
          </div>
        )}

        {orders.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:14, padding:'48px 20px', border:'1px solid #F3F4F6', textAlign:'center', color:'#9CA3AF' }}>
            <svg width="36" height="36" fill="none" stroke="#D1D5DB" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin:'0 auto 12px', display:'block' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
            </svg>
            <p style={{ fontWeight:600, fontSize:14 }}>{t('adminOrders.empty')}</p>
            <p style={{ fontSize:13, marginTop:4 }}>{t('adminOrders.emptyHint')}</p>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
              <span style={{ fontSize:13, color:'#6B7280' }}>{t('adminOrders.count', { n: orders.length })}</span>
              <span style={{ fontSize:13, color:'#6B7280' }}>
                {t('adminOrders.totalValue')}
                <strong style={{ color:'#1B5E20', marginLeft:6, fontSize:15 }}>{fmtRM(total)}</strong>
              </span>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {orders.map(o => {
                const isOpen = openId === o.id;
                const pending = confirm === o.id;
                return (
                  <div key={o.id} style={{ background:'#fff', borderRadius:14, padding:'14px 16px', border:`1.5px solid ${pending ? '#FCA5A5' : '#F3F4F6'}` }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                      <div style={{ minWidth:0 }}>
                        <p style={{ margin:0, fontSize:15, fontWeight:700, color:'#111827' }}>{o.studentName}</p>
                        <p style={{ margin:'2px 0 0', fontSize:12.5, color:'#6B7280' }}>
                          {monthLabel(o.monthKey, lang)} · {classLabel(o)}
                        </p>
                        {o.planLabel && (
                          <p style={{ margin:'3px 0 0', fontSize:12, color:'#9CA3AF' }}>{o.planLabel}</p>
                        )}
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <p style={{ margin:0, fontSize:17, fontWeight:800, color:'#1B5E20', fontVariantNumeric:'tabular-nums' }}>{fmtRM(o.total)}</p>
                        <p style={{ margin:'2px 0 0', fontSize:12, color:'#9CA3AF' }}>{t('parent.schoolDays', { n: o.dayCount })}</p>
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:14, alignItems:'center', marginTop:10 }}>
                      <button onClick={() => setOpenId(isOpen ? null : o.id)} aria-expanded={isOpen}
                        style={{ background:'none', border:'none', padding:0, cursor:'pointer', color:'#1B5E20', fontSize:13, fontWeight:700 }}>
                        {isOpen ? t('parent.hideDays') : t('parent.viewDays', { n: o.dayCount })}
                      </button>
                      {!pending && (
                        <button onClick={() => setConfirm(o.id)}
                          style={{ background:'none', border:'none', padding:0, cursor:'pointer', color:'#DC2626', fontSize:13, fontWeight:700, marginLeft:'auto' }}>
                          {t('adminOrders.cancel')}
                        </button>
                      )}
                    </div>

                    {pending && (
                      <div style={{ marginTop:10, background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'11px 13px' }}>
                        <p style={{ margin:0, fontSize:13, color:'#991B1B', fontWeight:600 }}>
                          {t('adminOrders.confirmBody', { name: o.studentName, month: monthLabel(o.monthKey, lang) })}
                        </p>
                        <p style={{ margin:'3px 0 9px', fontSize:12, color:'#B91C1C' }}>{t('adminOrders.confirmHint')}</p>
                        <div style={{ display:'flex', gap:8 }}>
                          <button onClick={() => doCancel(o)}
                            style={{ background:'#DC2626', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                            {t('adminOrders.confirmYes')}
                          </button>
                          <button onClick={() => setConfirm(null)}
                            style={{ background:'#fff', color:'#374151', border:'1px solid #E5E7EB', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    )}

                    {isOpen && (
                      <div style={{ marginTop:10, borderTop:'1px solid #F3F4F6', paddingTop:10, display:'flex', flexDirection:'column', gap:6 }}>
                        {detail.map(d => {
                          const day = parseInt(d.date.slice(8), 10);
                          const meals = [
                            d.breakfast && `${t('meal.breakfast')}: ${d.breakfast === CHEF_CHOICE ? t('order.chefsChoice') : d.breakfast}`,
                            d.lunch     && `${t('meal.lunch')}: ${d.lunch === CHEF_CHOICE ? t('order.chefsChoice') : d.lunch}`,
                            d.brunch    && `${t('meal.brunch')}: ${d.brunch === CHEF_CHOICE ? t('order.chefsChoice') : d.brunch}`,
                          ].filter(Boolean);
                          return (
                            <div key={d.date} style={{
                              display:'flex', gap:10, justifyContent:'space-between', alignItems:'flex-start',
                              // Same tinted blocks as the parent view, so a day
                              // reads as one unit in both places.
                              background: isDateLocked(d.date) ? '#F9FAFB' : '#F0FDF4',
                              border:`1px solid ${isDateLocked(d.date) ? '#F1F3F5' : '#DCF0DD'}`,
                              borderRadius:10, padding:'9px 11px',
                            }}>
                              <div style={{ minWidth:0 }}>
                                <p style={{ margin:0, fontSize:12.5, fontWeight:700, color:'#374151' }}>{fmtDateInMonth(lang, o.monthKey, day, false)}</p>
                                {meals.map(m => <p key={m} style={{ margin:'1px 0 0', fontSize:12, color:'#6B7280' }}>{m}</p>)}
                              </div>
                              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0 }}>
                                <span style={{ fontSize:13.5, fontWeight:700, color:'#111827', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>{fmtRM(d.price)}</span>
                                {isDateLocked(d.date) && (
                                  <span style={{ fontSize:10.5, color:'#9CA3AF', fontWeight:600 }}>{t('parent.dayClosed')}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
  container:   { maxWidth:640, margin:'0 auto', padding:'20px 16px', display:'flex', flexDirection:'column', gap:14 },
};
