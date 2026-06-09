import { ORDERS, ALLERGY_LABELS, dayTitle } from '../../../../lib/mockOrders';

export async function GET(request, { params }) {
  const { day } = await params;
  const { searchParams } = new URL(request.url);
  const deptFilter = searchParams.get('dept') || 'All';

  const isFriday = day === 'Fri';
  const rawOrders = ORDERS[day] || [];
  const filtered = deptFilter === 'All' ? rawOrders : rawOrders.filter(o => o.dept === deptFilter);

  const bfOrders = filtered.filter(o => o.breakfast);
  const lnOrders = filtered.filter(o => o.lunch);
  const brOrders = filtered.filter(o => o.brunch);
  const maxRows  = isFriday ? brOrders.length : Math.max(bfOrders.length, lnOrders.length);

  // Use the specific date if provided, otherwise fall back to generic label
  const dateParam = searchParams.get('date');
  let title;
  if (dateParam) {
    const d = parseInt(dateParam);
    const suffixes = ['th','st','nd','rd'];
    const v = d % 100;
    const s = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
    const dayName = { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday', Fri:'Friday' }[day] || day;
    title = `${dayName} - ${d}${s} June 2026`;
  } else {
    title = dayTitle(day);
  }

  // Build table rows HTML
  function classCell(o) {
    return o.year ? `${o.dept}<br>${o.year}` : o.dept;
  }

  function allergyTags(o) {
    if (!o.allergies?.length) return '';
    return o.allergies.map(a => {
      const info = ALLERGY_LABELS[a];
      if (!info) return '';
      return `<span style="display:inline-block;font-size:7pt;font-weight:700;padding:1pt 4pt;border-radius:4pt;background:${info.bg};color:${info.color};border:0.5pt solid ${info.color};margin:1pt 1pt 0 0">${info.en}</span>`;
    }).join('');
  }

  const tableRows = isFriday
    ? brOrders.map((o, i) => `
        <tr class="${i % 2 === 0 ? 'odd' : 'even'}">
          <td class="c-name">${o.name}${o.allergies?.length ? `<br><span style="font-size:8pt">${allergyTags(o)}</span>` : ''}</td>
          <td class="c-class">${classCell(o)}</td>
          <td class="c-meal">${o.brunch}</td>
        </tr>`).join('')
    : Array.from({ length: maxRows }, (_, i) => {
        const b = bfOrders[i];
        const l = lnOrders[i];
        const shade = i % 2 === 0 ? 'odd' : 'even';
        return `
        <tr class="${shade}">
          <td class="c-name">${b ? b.name + (b.allergies?.length ? `<br>${allergyTags(b)}` : '') : ''}</td>
          <td class="c-class">${b ? classCell(b) : ''}</td>
          <td class="c-meal divider">${b ? b.breakfast : ''}</td>
          <td class="c-name">${l ? l.name + (l.allergies?.length ? `<br>${allergyTags(l)}` : '') : ''}</td>
          <td class="c-class">${l ? classCell(l) : ''}</td>
          <td class="c-meal">${l ? l.lunch : ''}</td>
        </tr>`;
      }).join('');

  const theadCols = isFriday
    ? `<th>Name</th><th>Class</th><th>Brunch</th>`
    : `<th>Name</th><th>Class</th><th class="divider">Breakfast</th><th>Name</th><th>Class</th><th>Lunch</th>`;

  const colgroup = isFriday
    ? `<col style="width:30%"><col style="width:20%"><col style="width:50%">`
    : `<col style="width:16%"><col style="width:12%"><col style="width:22%"><col style="width:16%"><col style="width:12%"><col style="width:22%">`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, sans-serif;
      background: #f0f0f0;
      padding: 20px;
      color: #000;
    }

    /* ── Screen toolbar ── */
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #1B5E20;
      color: #fff;
      padding: 12px 20px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
    .toolbar h1 { font-size: 15px; font-weight: 700; }
    .toolbar p  { font-size: 12px; opacity: 0.75; margin-top: 3px; }
    .print-btn {
      background: #fff;
      color: #1B5E20;
      border: none;
      border-radius: 8px;
      padding: 9px 20px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .print-btn:hover { background: #f0f0f0; }

    /* ── A4 page wrapper ── */
    .page {
      background: #fff;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 12mm 10mm;
      box-shadow: 0 2px 20px rgba(0,0,0,0.15);
    }

    .doc-title {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 6pt;
      color: #000;
    }

    /* ── Sticker table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    thead th {
      font-size: 7.5pt;
      font-weight: bold;
      padding: 3pt 4pt;
      border: 0.5pt solid #000;
      background: #fff;
      text-align: left;
    }

    td {
      border: 0.5pt solid #000;
      vertical-align: top;
      overflow: hidden;
    }

    .c-name {
      font-size: 10pt;
      font-weight: bold;
      padding: 3pt 4pt 1pt;
      line-height: 1.25;
    }
    .c-class {
      font-size: 7pt;
      padding: 5pt 3pt 1pt;
      line-height: 1.3;
      word-break: break-word;
    }
    .c-meal {
      font-size: 7pt;
      padding: 3pt 4pt;
      line-height: 1.35;
      word-break: break-word;
    }

    .divider { border-right: 1.5pt solid #000; }

    tr.odd  td { background-color: #ffffff; }
    tr.even td { background-color: #F7F9FA; }

    /* ── Print ── */
    @page {
      size: A4 portrait;
      margin: 10mm;
    }

    @media print {
      body {
        background: #fff !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .toolbar { display: none !important; }
      .page {
        width: 100% !important;
        min-height: unset !important;
        padding: 0 !important;
        box-shadow: none !important;
        margin: 0 !important;
      }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
      tr.even td { background-color: #F7F9FA !important; }
    }
  </style>
</head>
<body>

  <!-- Toolbar (screen only) -->
  <div class="toolbar">
    <div>
      <h1>${title}</h1>
      <p>${isFriday ? 'Brunch' : 'Breakfast &amp; Lunch'} &middot; ${filtered.length} orders${deptFilter !== 'All' ? ` &middot; ${deptFilter}` : ''}</p>
    </div>
    <button class="print-btn" onclick="window.print()">
      <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"/>
      </svg>
      Print
    </button>
  </div>

  <!-- A4 page -->
  <div class="page">
    <div class="doc-title">${title}</div>
    <table>
      <colgroup>${colgroup}</colgroup>
      <thead><tr>${theadCols}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>

</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
