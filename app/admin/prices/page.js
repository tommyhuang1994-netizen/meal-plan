'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CHEFS_PRICING, MENU_PRICING } from '../../../lib/pricingData';
import { useT } from '../../../lib/i18n';

function fmt(n) { return `RM ${Number(n).toFixed(2)}`; }
function pct(cost, parent) {
  if (!cost || !parent) return 0;
  return (((parent - cost) / cost) * 100).toFixed(0);
}
function markup(cost, parent) { return (parent - cost).toFixed(2); }

const TYPE_COLORS = {
  Breakfast: { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706' },
  Lunch:     { bg: '#EFF6FF', border: '#BFDBFE', text: '#1565C0' },
  Brunch:    { bg: '#F1F8E9', border: '#C5E1A5', text: '#558B2F' },
};

export default function AdminPricesPage() {
  const router = useRouter();
  const { t } = useT();
  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') !== 'true') router.replace('/admin');
  }, []);

  const [chefs,    setChefs]   = useState(() => CHEFS_PRICING.map(r => ({ ...r })));
  const [menu,     setMenu]    = useState(() =>
    Object.entries(MENU_PRICING).map(([name, v]) => ({ name, ...v }))
  );
  const [activeTab, setTab]    = useState('menu'); // 'menu' | 'chefs'
  const [editRow,   setEdit]   = useState(null);   // { table, index }
  const [draft,     setDraft]  = useState({});
  const [saved,     setSaved]  = useState(false);

  function startEdit(table, index, row) {
    setEdit({ table, index });
    setDraft({ vendorCost: String(row.vendorCost), parentPrice: String(row.parentPrice) });
  }

  function saveEdit() {
    const vc = parseFloat(draft.vendorCost) || 0;
    const pp = parseFloat(draft.parentPrice) || 0;
    if (editRow.table === 'chefs') {
      setChefs(prev => prev.map((r, i) => i === editRow.index ? { ...r, vendorCost: vc, parentPrice: pp } : r));
    } else {
      setMenu(prev => prev.map((r, i) => i === editRow.index ? { ...r, vendorCost: vc, parentPrice: pp } : r));
    }
    setEdit(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const menuByType = menu.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  const totalMenuRevenue = menu.reduce((s, r) => s + r.parentPrice, 0);
  const totalMenuCost    = menu.reduce((s, r) => s + r.vendorCost, 0);
  const totalMarkup      = totalMenuRevenue - totalMenuCost;

  return (
    <main style={{ background: '#FAFAFA', minHeight: '100dvh', paddingBottom: 40 }}>

      <header style={S.header}>
        <Link href="/admin/dashboard" style={S.backLink}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          {t('common.admin')}
        </Link>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={S.headerTitle}>{t('adminPrices.title')}</h1>
            <p style={S.headerSub}>{t('adminPrices.subtitle')}</p>
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

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
          {[
            { label:t('prices.totalVendorCost'), value: fmt(totalMenuCost),    sub:t('prices.sumCost'),   color:'#1565C0' },
            { label:t('prices.totalParentPrice'),value: fmt(totalMenuRevenue), sub:t('prices.sumParent'), color:'#1B5E20' },
            { label:t('prices.totalMarkup'),     value: fmt(totalMarkup),      sub:t('prices.avgMargin', { x: ((totalMarkup/totalMenuCost)*100).toFixed(0) }), color:'#D97706' },
          ].map(c => (
            <div key={c.label} style={{ background:'#fff', borderRadius:12, padding:'14px 12px', border:'1px solid #F3F4F6', textAlign:'center' }}>
              <p style={{ fontSize:10, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.04em', margin:'0 0 6px' }}>{c.label}</p>
              <p style={{ fontSize:16, fontWeight:800, color:c.color, margin:'0 0 2px', fontVariantNumeric:'tabular-nums' }}>{c.value}</p>
              <p style={{ fontSize:10, color:'#9CA3AF', margin:0 }}>{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:8 }}>
          {[['menu', t('prices.tabMenu')], ['chefs', t('prices.tabChefs')]].map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setEdit(null); }}
              style={{ flex:1, padding:'10px 0', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:14,
                background: activeTab === id ? '#1B5E20' : '#fff',
                color:      activeTab === id ? '#fff'    : '#374151',
                boxShadow:  activeTab === id ? '0 2px 8px rgba(27,94,32,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:16, fontSize:12, color:'#6B7280', alignItems:'center' }}>
          <span>{t('prices.clickEdit', { edit: t('common.edit') })}</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#DCFCE7', border:'1px solid #86EFAC', display:'inline-block' }} /> {t('prices.markupOver25')}
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#FEF9C3', border:'1px solid #FDE047', display:'inline-block' }} /> {t('prices.markup10to25')}
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#FEE2E2', border:'1px solid #FCA5A5', display:'inline-block' }} /> {t('prices.markupUnder10')}
          </span>
        </div>

        {/* ── Chef's Choice tab ── */}
        {activeTab === 'chefs' && (
          <div style={S.tableCard}>
            <table style={S.table}>
              <thead>
                <tr style={{ background:'#F9FAFB' }}>
                  <th style={S.th}>{t('prices.colPlan')}</th>
                  <th style={{ ...S.th, textAlign:'right' }}>{t('prices.colVendorCost')}</th>
                  <th style={{ ...S.th, textAlign:'right' }}>{t('prices.colParentPrice')}</th>
                  <th style={{ ...S.th, textAlign:'right' }}>{t('prices.colMarkup')}</th>
                  <th style={{ ...S.th, textAlign:'center' }}>%</th>
                  <th style={{ ...S.th, width:60 }}></th>
                </tr>
              </thead>
              <tbody>
                {chefs.map((row, i) => {
                  const mp  = pct(row.vendorCost, row.parentPrice);
                  const mu  = markup(row.vendorCost, row.parentPrice);
                  const rowBg = mp >= 25 ? '#F0FDF4' : mp >= 10 ? '#FEFCE8' : '#FFF5F5';
                  const isEdit = editRow?.table === 'chefs' && editRow?.index === i;
                  return (
                    <tr key={row.id} style={{ borderTop:'1px solid #F3F4F6', background: isEdit ? '#F0FDF4' : rowBg }}>
                      <td style={S.td}>
                        <p style={{ margin:0, fontWeight:600, fontSize:14 }}>{row.label}</p>
                        <p style={{ margin:'2px 0 0', fontSize:12, color:'#9CA3AF' }}>{row.note}</p>
                      </td>
                      {isEdit ? (
                        <>
                          <td style={{ ...S.td, textAlign:'right' }}>
                            <input type="number" step="0.50" value={draft.vendorCost}
                              onChange={e => setDraft(d => ({ ...d, vendorCost: e.target.value }))}
                              style={S.priceInput} />
                          </td>
                          <td style={{ ...S.td, textAlign:'right' }}>
                            <input type="number" step="0.50" value={draft.parentPrice}
                              onChange={e => setDraft(d => ({ ...d, parentPrice: e.target.value }))}
                              style={S.priceInput} />
                          </td>
                          <td style={{ ...S.td, textAlign:'right', color:'#16A34A', fontWeight:700 }}>
                            RM {(parseFloat(draft.parentPrice||0) - parseFloat(draft.vendorCost||0)).toFixed(2)}
                          </td>
                          <td style={{ ...S.td, textAlign:'center' }}>
                            <MarkupBadge value={pct(draft.vendorCost, draft.parentPrice)} />
                          </td>
                          <td style={S.td}>
                            <div style={{ display:'flex', gap:4 }}>
                              <button onClick={saveEdit} style={S.saveBtn}>{t('common.save')}</button>
                              <button onClick={() => setEdit(null)} style={S.cancelBtn}>✕</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ ...S.td, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{fmt(row.vendorCost)}</td>
                          <td style={{ ...S.td, textAlign:'right', fontWeight:700, fontVariantNumeric:'tabular-nums' }}>{fmt(row.parentPrice)}</td>
                          <td style={{ ...S.td, textAlign:'right', color:'#16A34A', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>+{fmt(mu)}</td>
                          <td style={{ ...S.td, textAlign:'center' }}><MarkupBadge value={mp} /></td>
                          <td style={S.td}>
                            <button onClick={() => startEdit('chefs', i, row)} style={S.editBtn}>{t('common.edit')}</button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── À La Carte tab ── */}
        {activeTab === 'menu' && ['Breakfast','Lunch','Brunch'].map(type => {
          const items = menuByType[type] || [];
          const col   = TYPE_COLORS[type];
          if (!items.length) return null;
          return (
            <div key={type} style={S.tableCard}>
              <div style={{ padding:'12px 16px 10px', borderBottom:'1px solid #F3F4F6', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:9, height:9, borderRadius:'50%', background:col.text, display:'inline-block' }} />
                <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:'#111827' }}>{t('meal.' + type.toLowerCase())}</h3>
                <span style={{ fontSize:12, color:'#9CA3AF' }}>{t('adminMenu.items', { n: items.length })}</span>
                <span style={{ marginLeft:'auto', fontSize:12, color:'#6B7280' }}>
                  {t('prices.avgMarkup')} <strong style={{ color:'#1B5E20' }}>
                    {(items.reduce((s,r)=>s+parseFloat(pct(r.vendorCost,r.parentPrice)),0)/items.length).toFixed(0)}%
                  </strong>
                </span>
              </div>
              <table style={S.table}>
                <thead>
                  <tr style={{ background:'#F9FAFB' }}>
                    <th style={S.th}>{t('prices.colItem')}</th>
                    <th style={{ ...S.th, textAlign:'right' }}>Vendor Cost</th>
                    <th style={{ ...S.th, textAlign:'right' }}>Parent Price</th>
                    <th style={{ ...S.th, textAlign:'right' }}>Markup</th>
                    <th style={{ ...S.th, textAlign:'center' }}>%</th>
                    <th style={{ ...S.th, width:60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, i) => {
                    const globalIdx = menu.findIndex(m => m.name === row.name);
                    const mp  = pct(row.vendorCost, row.parentPrice);
                    const mu  = markup(row.vendorCost, row.parentPrice);
                    const rowBg = mp >= 25 ? '#F0FDF4' : mp >= 10 ? '#FEFCE8' : '#FFF5F5';
                    const isEdit = editRow?.table === 'menu' && editRow?.index === globalIdx;
                    return (
                      <tr key={row.name} style={{ borderTop:'1px solid #F3F4F6', background: isEdit ? '#F0FDF4' : rowBg }}>
                        <td style={{ ...S.td, fontWeight:500 }}>{row.name}</td>
                        {isEdit ? (
                          <>
                            <td style={{ ...S.td, textAlign:'right' }}>
                              <input type="number" step="0.50" value={draft.vendorCost}
                                onChange={e => setDraft(d => ({ ...d, vendorCost: e.target.value }))}
                                style={S.priceInput} />
                            </td>
                            <td style={{ ...S.td, textAlign:'right' }}>
                              <input type="number" step="0.50" value={draft.parentPrice}
                                onChange={e => setDraft(d => ({ ...d, parentPrice: e.target.value }))}
                                style={S.priceInput} />
                            </td>
                            <td style={{ ...S.td, textAlign:'right', color:'#16A34A', fontWeight:700 }}>
                              RM {(parseFloat(draft.parentPrice||0) - parseFloat(draft.vendorCost||0)).toFixed(2)}
                            </td>
                            <td style={{ ...S.td, textAlign:'center' }}>
                              <MarkupBadge value={pct(draft.vendorCost, draft.parentPrice)} />
                            </td>
                            <td style={S.td}>
                              <div style={{ display:'flex', gap:4 }}>
                                <button onClick={saveEdit} style={S.saveBtn}>{t('common.save')}</button>
                                <button onClick={() => setEdit(null)} style={S.cancelBtn}>✕</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ ...S.td, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{fmt(row.vendorCost)}</td>
                            <td style={{ ...S.td, textAlign:'right', fontWeight:700, fontVariantNumeric:'tabular-nums' }}>{fmt(row.parentPrice)}</td>
                            <td style={{ ...S.td, textAlign:'right', color:'#16A34A', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>+{fmt(mu)}</td>
                            <td style={{ ...S.td, textAlign:'center' }}><MarkupBadge value={mp} /></td>
                            <td style={S.td}>
                              <button onClick={() => startEdit('menu', globalIdx, row)} style={S.editBtn}>{t('common.edit')}</button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function MarkupBadge({ value }) {
  const v = parseFloat(value);
  const bg    = v >= 25 ? '#DCFCE7' : v >= 10 ? '#FEF9C3' : '#FEE2E2';
  const color = v >= 25 ? '#16A34A' : v >= 10 ? '#D97706' : '#DC2626';
  return (
    <span style={{ display:'inline-block', fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:12, background:bg, color, fontVariantNumeric:'tabular-nums' }}>
      {v}%
    </span>
  );
}

const S = {
  header:     { background:'#fff', borderBottom:'1px solid #F3F4F6', padding:'16px 20px 20px', display:'flex', flexDirection:'column', gap:10 },
  backLink:   { display:'inline-flex', alignItems:'center', gap:4, color:'#6B7280', textDecoration:'none', fontSize:13, fontWeight:500 },
  headerTitle:{ fontSize:22, fontWeight:700, color:'#111827', margin:0 },
  headerSub:  { fontSize:13, color:'#6B7280', margin:0 },
  container:  { maxWidth:860, margin:'0 auto', padding:'20px 16px', display:'flex', flexDirection:'column', gap:16 },
  tableCard:  { background:'#fff', borderRadius:12, overflow:'hidden', border:'1px solid #F3F4F6' },
  table:      { width:'100%', borderCollapse:'collapse' },
  th:         { padding:'8px 14px', fontSize:11, fontWeight:700, color:'#6B7280', textAlign:'left', textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap' },
  td:         { padding:'10px 14px', fontSize:13, color:'#111827', verticalAlign:'middle' },
  priceInput: { width:70, padding:'5px 8px', borderRadius:7, border:'1.5px solid #1B5E20', fontSize:13, textAlign:'right', outline:'none' },
  editBtn:    { background:'#F0FDF4', border:'1px solid #C8E6C9', borderRadius:7, padding:'5px 10px', fontSize:12, fontWeight:700, color:'#1B5E20', cursor:'pointer' },
  saveBtn:    { background:'#1B5E20', color:'#fff', border:'none', borderRadius:7, padding:'5px 10px', fontSize:12, fontWeight:700, cursor:'pointer' },
  cancelBtn:  { background:'#F3F4F6', color:'#374151', border:'none', borderRadius:7, padding:'5px 8px', fontSize:12, cursor:'pointer' },
};
