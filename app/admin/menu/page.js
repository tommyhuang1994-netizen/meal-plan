'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MENU_BY_DATE, getSchoolDays, isFridayDate, dateKey, dayLabel, ordinal } from '../../../lib/menuData';

let nextId = 9000;
function genId() { return `new-${nextId++}`; }
function fmt(n)  { return `RM ${Number(n).toFixed(2)}`; }

const GRID_HEADERS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function calendarCells() {
  const firstDow = new Date(2026, 5, 1).getDay();
  const blanks   = firstDow === 0 ? 6 : firstDow - 1;
  const cells = [];
  for (let i = 0; i < blanks; i++) cells.push(null);
  for (let d = 1; d <= 30; d++) cells.push(d);
  return cells;
}

export default function AdminMenuPage() {
  const router = useRouter();
  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') !== 'true') router.replace('/admin');
  }, []);

  const [menu,      setMenu]    = useState(() => JSON.parse(JSON.stringify(MENU_BY_DATE)));
  const [activeDate,setDate]    = useState(null); // number 1-30
  const [editingId, setEdit]    = useState(null);
  const [draft,     setDraft]   = useState({});
  const [saved,     setSaved]   = useState(false);

  const schoolDays = getSchoolDays();
  const cells      = calendarCells();

  const key      = activeDate ? dateKey(activeDate) : null;
  const dayMenu  = key ? (menu[key] || {}) : null;
  const isFri    = activeDate ? isFridayDate(activeDate) : false;
  const sections = !dayMenu ? [] : isFri
    ? [{ key: 'brunch',    label: 'Brunch',    color: '#558B2F' }]
    : [{ key: 'breakfast', label: 'Breakfast', color: '#D97706' },
       { key: 'lunch',     label: 'Lunch',     color: '#2563EB' }];

  function startEdit(item) {
    setEdit(item.id);
    setDraft({ name: item.name, desc: item.desc, price: String(item.price) });
  }

  function saveEdit(section, itemId) {
    setMenu(prev => {
      const updated = { ...prev[key], [section]: prev[key][section].map(it =>
        it.id === itemId ? { ...it, name: draft.name, desc: draft.desc, price: parseFloat(draft.price) || 0 } : it
      )};
      return { ...prev, [key]: updated };
    });
    setEdit(null);
    flash();
  }

  function deleteItem(section, itemId) {
    setMenu(prev => ({
      ...prev,
      [key]: { ...prev[key], [section]: prev[key][section].filter(it => it.id !== itemId) },
    }));
    flash();
  }

  function addItem(section) {
    const newItem = { id: genId(), name: 'New Item', desc: 'Description', price: 0 };
    setMenu(prev => ({
      ...prev,
      [key]: { ...prev[key], [section]: [...(prev[key][section] || []), newItem] },
    }));
    setEdit(newItem.id);
    setDraft({ name: 'New Item', desc: 'Description', price: '0' });
  }

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  return (
    <main style={{ background: '#FAFAFA', minHeight: '100dvh', paddingBottom: 40 }}>
      <header style={S.header}>
        <Link href="/admin/dashboard" style={S.backLink}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Admin
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={S.headerTitle}>Manage Menu</h1>
            <p style={S.headerSub}>Set meals and prices per date · June 2026</p>
          </div>
          {saved && (
            <span style={{ display:'flex', alignItems:'center', gap:5, background:'#DCFCE7', color:'#1B5E20', fontSize:13, fontWeight:600, padding:'6px 12px', borderRadius:20 }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Saved
            </span>
          )}
        </div>
      </header>

      <div style={S.container}>

        {/* Calendar */}
        <div style={{ background:'#fff', borderRadius:14, padding:'18px 20px', border:'1px solid #F3F4F6' }}>
          <h2 style={{ fontSize:15, fontWeight:700, color:'#111827', marginBottom:14 }}>June 2026 — select a date to edit its menu</h2>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4, marginBottom:4 }}>
            {GRID_HEADERS.map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700, color: d==='Sat'||d==='Sun' ? '#D1D5DB' : '#6B7280', padding:'3px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4 }}>
            {cells.map((date, i) => {
              if (!date) return <div key={i} />;
              const dow     = new Date(2026, 5, date).getDay();
              const weekend = dow === 0 || dow === 6;
              const isSchool = schoolDays.includes(date);
              const isSel   = activeDate === date;
              const isFri   = dow === 5;

              return (
                <button key={i} disabled={weekend} onClick={() => { setDate(date); setEdit(null); }}
                  style={{
                    aspectRatio:'1', borderRadius:9, border: `1.5px solid ${isSel ? '#1B5E20' : '#F3F4F6'}`,
                    background: isSel ? '#1B5E20' : weekend ? '#FAFAFA' : '#fff',
                    cursor: weekend ? 'default' : 'pointer',
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3,
                    transition:'all 150ms',
                  }}>
                  <span style={{ fontSize:13, fontWeight: isSel ? 700 : 500, color: isSel ? '#fff' : weekend ? '#D1D5DB' : '#111827' }}>
                    {date}
                  </span>
                  {isSchool && !weekend && (
                    <span style={{ width:5, height:5, borderRadius:'50%', background: isSel ? 'rgba(255,255,255,0.7)' : isFri ? '#558B2F' : '#1B5E20' }} />
                  )}
                </button>
              );
            })}
          </div>
          <div style={{ display:'flex', gap:14, marginTop:10, fontSize:11, color:'#9CA3AF' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:7, height:7, borderRadius:'50%', background:'#1B5E20', display:'inline-block' }} /> Mon–Thu</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:7, height:7, borderRadius:'50%', background:'#558B2F', display:'inline-block' }} /> Friday (Brunch)</span>
          </div>
        </div>

        {/* Date editor */}
        {!activeDate ? (
          <div style={{ background:'#fff', borderRadius:12, padding:'40px 20px', border:'1px solid #F3F4F6', textAlign:'center', color:'#9CA3AF' }}>
            <svg width="34" height="34" fill="none" stroke="#D1D5DB" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin:'0 auto 10px', display:'block' }}>
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p style={{ fontWeight:600, fontSize:14 }}>Select a school day above</p>
            <p style={{ fontSize:13, marginTop:4 }}>Then add or edit the menu items for that date</p>
          </div>
        ) : (
          <div style={{ background:'#fff', borderRadius:12, padding:'16px', border:'1px solid #F3F4F6' }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:'#111827', margin:'0 0 16px' }}>
              {dayLabel(activeDate)}, {ordinal(activeDate)} June 2026
              {isFri && <span style={{ marginLeft:8, fontSize:12, background:'#F3E8FF', color:'#7E22CE', padding:'2px 8px', borderRadius:12, fontWeight:600 }}>Brunch Only</span>}
            </h2>

            {sections.map(({ key: section, label, color }) => (
              <div key={section} style={{ marginBottom: section === 'breakfast' ? 20 : 0 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:9, height:9, borderRadius:'50%', background:color, display:'inline-block' }} />
                    <span style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{label}</span>
                    <span style={{ fontSize:12, color:'#9CA3AF' }}>{dayMenu?.[section]?.length ?? 0} items</span>
                  </div>
                  <button onClick={() => addItem(section)} style={{ ...S.addBtn, borderColor:color, color }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Add
                  </button>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  {(dayMenu?.[section] || []).map(item => {
                    const isEditing = editingId === item.id;
                    return (
                      <div key={item.id} style={{ ...S.itemCard, border:`1.5px solid ${isEditing ? color : '#F3F4F6'}` }}>
                        {isEditing ? (
                          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                            <div style={{ display:'flex', gap:8 }}>
                              <div style={{ flex:1 }}>
                                <label style={S.lbl}>Item name</label>
                                <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name:e.target.value }))} style={S.inp} />
                              </div>
                              <div style={{ width:90 }}>
                                <label style={S.lbl}>Price (RM)</label>
                                <input type="number" step="0.50" min="0" value={draft.price}
                                  onChange={e => setDraft(d => ({ ...d, price:e.target.value }))} style={{ ...S.inp, textAlign:'right' }} />
                              </div>
                            </div>
                            <div>
                              <label style={S.lbl}>Description</label>
                              <input value={draft.desc} onChange={e => setDraft(d => ({ ...d, desc:e.target.value }))} style={S.inp} placeholder="Brief description" />
                            </div>
                            <div style={{ display:'flex', gap:8 }}>
                              <button onClick={() => saveEdit(section, item.id)} style={{ ...S.saveBtn, background:color }}>Save</button>
                              <button onClick={() => setEdit(null)} style={S.cancelBtn}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ flex:1 }}>
                              <p style={{ margin:0, fontWeight:600, fontSize:14, color:'#111827' }}>{item.name}</p>
                              <p style={{ margin:'2px 0 0', fontSize:12, color:'#9CA3AF' }}>{item.desc}</p>
                            </div>
                            <span style={{ fontSize:14, fontWeight:700, color:'#374151', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>{fmt(item.price)}</span>
                            <button onClick={() => startEdit(item)} style={S.iconBtn} title="Edit">
                              <svg width="15" height="15" fill="none" stroke="#6B7280" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => deleteItem(section, item.id)} style={S.iconBtn} title="Delete">
                              <svg width="15" height="15" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(dayMenu?.[section] || []).length === 0 && (
                    <div style={{ padding:'16px 0', textAlign:'center', color:'#9CA3AF', fontSize:13 }}>No items yet.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

const S = {
  header:    { background:'#fff', borderBottom:'1px solid #F3F4F6', padding:'16px 20px 20px', display:'flex', flexDirection:'column', gap:10 },
  backLink:  { display:'inline-flex', alignItems:'center', gap:4, color:'#6B7280', textDecoration:'none', fontSize:13, fontWeight:500 },
  headerTitle:{ fontSize:22, fontWeight:700, color:'#111827', margin:0 },
  headerSub: { fontSize:13, color:'#6B7280', margin:0 },
  container: { maxWidth:640, margin:'0 auto', padding:'20px 16px', display:'flex', flexDirection:'column', gap:16 },
  itemCard:  { borderRadius:9, padding:'11px 12px', background:'#FAFAFA', transition:'border-color 150ms ease' },
  addBtn:    { display:'inline-flex', alignItems:'center', gap:4, background:'transparent', border:'1.5px solid', borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:700, cursor:'pointer' },
  iconBtn:   { background:'transparent', border:'none', cursor:'pointer', padding:'4px', borderRadius:6, display:'flex', alignItems:'center' },
  lbl:       { display:'block', fontSize:11, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:4 },
  inp:       { width:'100%', padding:'8px 10px', borderRadius:8, border:'1.5px solid #E5E7EB', fontSize:14, outline:'none', boxSizing:'border-box', background:'#fff' },
  saveBtn:   { flex:1, color:'#fff', border:'none', borderRadius:8, padding:'9px 0', fontSize:14, fontWeight:700, cursor:'pointer' },
  cancelBtn: { padding:'9px 16px', background:'#F3F4F6', border:'none', borderRadius:8, fontSize:14, fontWeight:600, color:'#374151', cursor:'pointer' },
};
