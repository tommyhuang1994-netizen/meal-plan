'use client';

// Dietary requirements, shown the same way wherever they appear.
//
// The chips come from matching the parent's free text; the note is that text
// verbatim. The note is always rendered when present, because the matching is
// best-effort — "Broad Bean (G6PD)" and "Aloe vera" have no chip, and showing
// only chips would drop the warning entirely.

import { ALLERGY_LABELS } from '../lib/mockOrders';

export function AllergyTags({ allergies = [], note = '', lang = 'en', size = 'sm' }) {
  if (!allergies.length && !note) return null;
  const fs = size === 'sm' ? 10 : 11;
  return (
    <span style={{ display:'inline-flex', flexWrap:'wrap', gap:4, alignItems:'center' }}>
      {allergies.map(a => {
        const info = ALLERGY_LABELS[a];
        if (!info) return null;
        return (
          <span key={a} style={{
            fontSize: fs, fontWeight:700, padding:'1px 6px', borderRadius:4,
            background: info.bg, color: info.color, border:`1px solid ${info.color}33`,
            whiteSpace:'nowrap',
          }}>
            ⚠ {lang === 'zh' ? info.zh : info.en}
          </span>
        );
      })}
      {note && (
        <span style={{
          fontSize: fs, fontWeight:600, padding:'1px 6px', borderRadius:4,
          background:'#FEF2F2', color:'#991B1B', border:'1px solid #FECACA', whiteSpace:'nowrap',
        }}>
          {note}
        </span>
      )}
    </span>
  );
}

/// A standing warning about declarations that could not be matched to a person.
export function UnattributedWarning({ rows = [], t }) {
  if (!rows.length) return null;
  return (
    <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:12, padding:'12px 14px' }}>
      <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#991B1B' }}>
        {t('allergy.unattributedTitle', { n: rows.length })}
      </p>
      <p style={{ margin:'3px 0 8px', fontSize:12, color:'#B91C1C', lineHeight:1.5 }}>
        {t('allergy.unattributedBody')}
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {rows.map(r => (
          <div key={r.submitted} style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', fontSize:12 }}>
            <span style={{ color:'#7F1D1D', fontWeight:700 }}>
              {r.dept}{r.year ? ` ${r.year}` : ''}
            </span>
            <AllergyTags allergies={r.allergies} note={r.note} />
            <span style={{ color:'#B91C1C', opacity:0.75 }}>{r.submitted}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
