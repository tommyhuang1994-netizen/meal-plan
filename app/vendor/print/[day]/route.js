import { ALLERGY_LABELS } from '../../../../lib/mockOrders';
import { MONTHS, getOrdersForDate, CHEF_CHOICE } from '../../../../lib/orderStore';
import { MENU_PRICING } from '../../../../lib/pricingData';

// The [day] segment now carries a month key ("2026-09"); ?date= carries the day.
export async function GET(request, { params }) {
  const { day: monthKey } = await params;
  const { searchParams } = new URL(request.url);
  const deptFilter = searchParams.get('dept') || 'All';
  const dateParam  = parseInt(searchParams.get('date') ?? '', 10);

  const meta = MONTHS.find(m => m.key === monthKey);
  if (!meta || !Number.isFinite(dateParam)) {
    return new Response('Unknown month or date', { status: 404 });
  }

  const dateObj  = new Date(meta.year, meta.month, dateParam);
  const isFriday = dateObj.getDay() === 5;

  // NOTE: this runs on the server, so it sees the generated sample orders only.
  // Orders a parent submits live in that browser's localStorage and cannot
  // reach here — they show in the dashboard but not on this printout until the
  // orders are stored server-side.
  const rawOrders = getOrdersForDate(monthKey, dateParam);
  const filtered = deptFilter === 'All' ? rawOrders : rawOrders.filter(o => o.dept === deptFilter);

  const bfOrders = filtered.filter(o => o.breakfast);
  const lnOrders = filtered.filter(o => o.lunch);
  const brOrders = filtered.filter(o => o.brunch);
  const maxRows  = isFriday ? brOrders.length : Math.max(bfOrders.length, lnOrders.length);

  const MONTH_EN = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
  const WD = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const suffixes = ['th','st','nd','rd'];
  const v = dateParam % 100;
  const sfx = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  const title = `${WD[dateObj.getDay()]} - ${dateParam}${sfx} ${MONTH_EN[meta.month]} ${meta.year}`;

  // ── Row helpers ────────────────────────────────────────────────────────────

  // "CAMBRIDGE Year 5" / "CAMBRIDGE PLUS" / "STAFF" — group uppercased, class
  // appended when the student has one.
  function classCell(o) {
    const group = (o.dept || '').toUpperCase();
    return o.year ? `${group} ${o.year}` : group;
  }

  // Bilingual meal label. A Chef's Choice slot names which meals it covers, so
  // the kitchen can tell a both-meals plan from a single one at a glance. An
  // à-la-carte pick is prefixed with its price, matching the order form.
  function mealLabel(o, slot) {
    const value = o[slot];
    if (!value) return '';
    if (value === CHEF_CHOICE) {
      const both = o.breakfast === CHEF_CHOICE && o.lunch === CHEF_CHOICE;
      if (both)             return "Chef's Choice (Breakfast &amp; Lunch) 厨师推荐（早餐与午餐）";
      if (slot === 'breakfast') return "Chef's Choice (Breakfast) 厨师推荐（早餐）";
      if (slot === 'lunch')     return "Chef's Choice (Lunch) 厨师推荐（午餐）";
      return "Chef's Choice (Brunch) 厨师推荐（早午餐）";
    }
    const price = MENU_PRICING[value]?.parentPrice;
    return price != null ? `RM${price} - ${value}` : value;
  }

  // Sort so identical meals sit together: both-meals Chef's Choice first, then
  // single Chef's Choice, then dishes A-Z; students by class, then name.
  function rank(o, slot) {
    if (o[slot] !== CHEF_CHOICE) return 2;
    return (o.breakfast === CHEF_CHOICE && o.lunch === CHEF_CHOICE) ? 0 : 1;
  }
  function groupBy(orders, slot) {
    return [...orders].sort((a, b) => {
      const r = rank(a, slot) - rank(b, slot);
      if (r) return r;
      const m = mealLabel(a, slot).localeCompare(mealLabel(b, slot));
      if (m) return m;
      const c = classCell(a).localeCompare(classCell(b), undefined, { numeric: true });
      if (c) return c;
      return a.name.localeCompare(b.name);
    });
  }

  function allergyTags(o) {
    if (!o.allergies?.length) return '';
    return o.allergies.map(a => {
      const info = ALLERGY_LABELS[a];
      if (!info) return '';
      return `<span style="display:inline-block;font-size:7pt;font-weight:700;padding:1pt 4pt;border-radius:4pt;background:${info.bg};color:${info.color};border:0.5pt solid ${info.color};margin:1pt 1pt 0 0">${info.en}</span>`;
    }).join('');
  }

  const bfSorted = groupBy(bfOrders, 'breakfast');
  const lnSorted = groupBy(lnOrders, 'lunch');
  const brSorted = groupBy(brOrders, 'brunch');

  // A thin rule wherever the meal changes, so each dish reads as one block.
  // The two columns differ in length, so guard both ends before comparing.
  const startsGroup = (list, i, slot) =>
    i > 0 && !!list[i] && !!list[i - 1] &&
    mealLabel(list[i], slot) !== mealLabel(list[i - 1], slot);

  const tableRows = isFriday
    ? brSorted.map((o, i) => `
        <tr class="${i % 2 === 0 ? 'odd' : 'even'}${startsGroup(brSorted, i, 'brunch') ? ' group-start' : ''}">
          <td class="c-name">${o.name}${o.allergies?.length ? `<br><span style="font-size:8pt">${allergyTags(o)}</span>` : ''}</td>
          <td class="c-class">${classCell(o)}</td>
          <td class="c-meal">${mealLabel(o, 'brunch')}</td>
        </tr>`).join('')
    : Array.from({ length: maxRows }, (_, i) => {
        const b = bfSorted[i];
        const l = lnSorted[i];
        const shade = i % 2 === 0 ? 'odd' : 'even';
        const bNew = startsGroup(bfSorted, i, 'breakfast');
        const lNew = startsGroup(lnSorted, i, 'lunch');
        return `
        <tr class="${shade}">
          <td class="c-name${bNew ? ' group-start' : ''}">${b ? b.name + (b.allergies?.length ? `<br>${allergyTags(b)}` : '') : ''}</td>
          <td class="c-class${bNew ? ' group-start' : ''}">${b ? classCell(b) : ''}</td>
          <td class="c-meal divider${bNew ? ' group-start' : ''}">${b ? mealLabel(b, 'breakfast') : ''}</td>
          <td class="c-name${lNew ? ' group-start' : ''}">${l ? l.name + (l.allergies?.length ? `<br>${allergyTags(l)}` : '') : ''}</td>
          <td class="c-class${lNew ? ' group-start' : ''}">${l ? classCell(l) : ''}</td>
          <td class="c-meal${lNew ? ' group-start' : ''}">${l ? mealLabel(l, 'lunch') : ''}</td>
        </tr>`;
      }).join('');

  const theadCols = isFriday
    ? `<th>Name</th><th>Class</th><th>Brunch</th>`
    : `<th>Name</th><th>Class</th><th class="divider">Breakfast</th><th>Name</th><th>Class</th><th>Lunch</th>`;

  const colgroup = isFriday
    ? `<col style="width:28%"><col style="width:20%"><col style="width:52%">`
    : `<col style="width:15%"><col style="width:13%"><col style="width:22%"><col style="width:15%"><col style="width:13%"><col style="width:22%">`;

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

    /* First row of each meal group gets a heavier top rule, so identical
       orders read as one block the kitchen can count. */
    .group-start { border-top: 1.2pt solid #000; }

    /* The meal cell carries English + Chinese, so give it more room to breathe
       than the class column and let it wrap rather than clip. */
    .c-meal { white-space: normal; }

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
