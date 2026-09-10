// The kitchen sheet as a real PDF file, not a web page to be printed.
//
//   /vendor/pdf/2026-09?date=14&dept=All
//
// Printing the HTML sheet goes through Safari and the copier driver, which is
// where it was coming out blank. A generated PDF removes both from the path:
// the file either has the orders in it or it does not, and that can be checked.
//
// Text is Latin-only. pdf-lib's standard fonts are WinAnsi, so a stray CJK
// character would throw mid-render; the bilingual labels on the HTML sheet are
// therefore rendered in English here, and every string is sanitised before it
// is drawn.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ordersForDate } from '../../../../lib/orders-db';
import { MONTHS } from '../../../../lib/orderStore';
import { MENU_PRICING } from '../../../../lib/pricingData';
import { ALLERGY_LABELS } from '../../../../lib/mockOrders';

export const dynamic = 'force-dynamic';

const CHEF = "Chef's Choice";
const A4 = [595.28, 841.89];
const MARGIN = 28;

/// WinAnsi only. Anything outside it is dropped rather than allowed to throw
/// halfway through a page — a missing glyph is survivable, a 500 is not.
const ascii = (s) => String(s ?? '').replace(/[^\x20-\x7E]/g, '').trim();

/// Greedy wrap to a pixel width, so a long dish name takes two lines in its
/// cell instead of running under the next column.
function wrap(text, font, size, width) {
  const words = ascii(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= width) line = next;
    else { if (line) lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function mealLabel(o, slot) {
  const value = o[slot];
  if (!value) return '';
  if (value === CHEF) {
    const both = o.breakfast === CHEF && o.lunch === CHEF;
    if (both) return "Chef's Choice (Breakfast & Lunch)";
    if (slot === 'breakfast') return "Chef's Choice (Breakfast)";
    if (slot === 'lunch') return "Chef's Choice (Lunch)";
    return "Chef's Choice (Brunch)";
  }
  const price = MENU_PRICING[value]?.parentPrice;
  return price != null ? `RM${price} - ${value}` : value;
}

/// "Cambridge Year 6", "Plus", "Cambridge Plus" — never "Cambridge Cambridge
/// Plus", which is what appending the division blindly produces for the one
/// division whose name already carries its group.
function classLabel(o) {
  if (!o.year) return o.dept;
  return o.year.startsWith(o.dept) ? o.year : `${o.dept} ${o.year}`;
}

function allergyText(o) {
  const chips = (o.allergies ?? []).map(a => ALLERGY_LABELS[a]?.en).filter(Boolean);
  const note = ascii(o.note);
  if (!chips.length && !note) return '';
  return note && !chips.length ? `! ${note}` : `! ${[...chips, note].filter(Boolean).join(', ')}`;
}

export async function GET(request, { params }) {
  const { day: monthKey } = await params;
  const { searchParams } = new URL(request.url);
  const dept = searchParams.get('dept') || 'All';
  const date = parseInt(searchParams.get('date') ?? '', 10);

  const meta = MONTHS.find(m => m.key === monthKey);
  if (!meta || !Number.isFinite(date)) {
    return new Response('Unknown month or date', { status: 404 });
  }

  const all = await ordersForDate(monthKey, date);
  const rows = dept === 'All' ? all : all.filter(o => o.dept === dept);

  const dateObj = new Date(meta.year, meta.month, date);
  const isFriday = dateObj.getDay() === 5;
  const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const sfx = ['th', 'st', 'nd', 'rd'][(date % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][date % 100] || 'th';
  const title = `${WD[dateObj.getDay()]} - ${date}${sfx} ${MONTH_EN[meta.month]} ${meta.year}`;

  // Sort so identical meals sit together — the kitchen counts them in blocks.
  const bySlot = (slot) => rows
    .filter(o => o[slot])
    .sort((a, b) => mealLabel(a, slot).localeCompare(mealLabel(b, slot))
      || a.name.localeCompare(b.name));

  const columns = isFriday
    ? [{ slot: 'brunch', label: 'Brunch', list: bySlot('brunch') }]
    : [
        { slot: 'breakfast', label: 'Breakfast', list: bySlot('breakfast') },
        { slot: 'lunch', label: 'Lunch', list: bySlot('lunch') },
      ];

  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const [PW, PH] = A4;
  const usable = PW - MARGIN * 2;
  const gap = 14;
  const colW = columns.length === 1 ? usable : (usable - gap) / 2;
  // Name / class / meal within a column.
  const cw = [colW * 0.30, colW * 0.22, colW * 0.48];

  const SIZE = 7.5;
  const NAME_SIZE = 8.5;
  const LEAD = 9.5;

  let page = null;
  let y = 0;

  const newPage = () => {
    page = pdf.addPage(A4);
    y = PH - MARGIN;
    page.drawText(ascii(title), { x: MARGIN, y: y - 12, size: 13, font: bold });
    page.drawText(`${rows.length} orders${dept !== 'All' ? ' - ' + dept : ''}`,
      { x: MARGIN, y: y - 26, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
    y -= 42;
    // Column headers
    columns.forEach((c, ci) => {
      const x0 = MARGIN + ci * (colW + gap);
      page.drawRectangle({ x: x0, y: y - 12, width: colW, height: 14, color: rgb(0.92, 0.94, 0.92) });
      ['NAME', 'CLASS', c.label.toUpperCase()].forEach((h, hi) => {
        const hx = x0 + cw.slice(0, hi).reduce((s, w) => s + w, 0) + 3;
        page.drawText(h, { x: hx, y: y - 9, size: 6.5, font: bold, color: rgb(0.25, 0.25, 0.25) });
      });
    });
    y -= 16;
  };

  newPage();

  // Walk both columns in step so each printed row lines up across the page.
  const maxRows = Math.max(...columns.map(c => c.list.length));
  for (let i = 0; i < maxRows; i++) {
    // How tall is this row? The tallest cell across the columns decides.
    let rowH = LEAD;
    const cells = columns.map(c => {
      const o = c.list[i];
      if (!o) return null;
      const nameLines = wrap(o.name, bold, NAME_SIZE, cw[0] - 6);
      const classLines = wrap(classLabel(o), font, SIZE, cw[1] - 6);
      const mealLines = wrap(mealLabel(o, c.slot), font, SIZE, cw[2] - 6);
      const al = allergyText(o);
      const alLines = al ? wrap(al, bold, SIZE - 0.5, cw[0] - 6) : [];
      const h = Math.max(
        (nameLines.length + alLines.length) * LEAD,
        classLines.length * LEAD,
        mealLines.length * LEAD,
      ) + 4;
      rowH = Math.max(rowH, h);
      return { o, nameLines, classLines, mealLines, alLines };
    });

    if (y - rowH < MARGIN) newPage();

    columns.forEach((c, ci) => {
      const cell = cells[ci];
      const x0 = MARGIN + ci * (colW + gap);
      // Row rule across the whole column, so empty cells still read as a row.
      page.drawLine({
        start: { x: x0, y: y - rowH + 2 },
        end: { x: x0 + colW, y: y - rowH + 2 },
        thickness: 0.4,
        color: rgb(0.8, 0.8, 0.8),
      });
      if (!cell) return;

      let ty = y - 8;
      for (const line of cell.nameLines) {
        page.drawText(line, { x: x0 + 3, y: ty, size: NAME_SIZE, font: bold });
        ty -= LEAD;
      }
      for (const line of cell.alLines) {
        page.drawText(line, { x: x0 + 3, y: ty, size: SIZE - 0.5, font: bold, color: rgb(0.7, 0.1, 0.1) });
        ty -= LEAD;
      }

      let cy = y - 8;
      for (const line of cell.classLines) {
        page.drawText(line, { x: x0 + cw[0] + 3, y: cy, size: SIZE, font, color: rgb(0.35, 0.35, 0.35) });
        cy -= LEAD;
      }

      let my = y - 8;
      for (const line of cell.mealLines) {
        page.drawText(line, { x: x0 + cw[0] + cw[1] + 3, y: my, size: SIZE, font });
        my -= LEAD;
      }
    });

    y -= rowH;
  }

  const bytes = await pdf.save();
  const filename = `${title.replace(/[^\w -]/g, '')}.pdf`;
  return new Response(Buffer.from(bytes), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  });
}
