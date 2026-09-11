// The kitchen sheet as a real PDF, laid out to match "Meal Plan Name List.xlsx".
//
//   /vendor/pdf/2026-09?date=14&dept=All
//
// Printing the HTML sheet goes through Safari and the copier driver, which is
// where the blank pages were coming from. A generated PDF removes both from the
// path: the file either contains the orders or it does not.
//
// GEOMETRY — every number below is read out of the workbook, not chosen. The
// sheet is printed onto A4 sticker stock and cut along the cell borders, so the
// boxes have to land where the school's own sheet puts them.
//
//   paperSize 9 (A4), portrait, pageSetUpPr fitToPage="1" fitToHeight="0"
//     -> scaled to fit ONE page wide, any number of pages tall
//   pageMargins 0.19685in left, 0.197in elsewhere -> 14.17pt (5mm)
//   printOptions horizontalCentered="1"
//   columns A..G  22 / 15.75 / 35.13 / 2.0 / 22 / 15.75 / 35.13 char units
//   rows          title 24pt, header 15.75pt, data 37.5pt
//   borders       thin on all four sides of every cell
//
// Excel char width -> px is round(w * 7 + 5) at the default font, and px -> pt
// is x0.75. That totals 801.75pt against 566.92pt of usable A4 width, so
// Excel's fit-to-width scale is 0.7071 and a data row prints at 26.52pt (9.4mm).
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ordersForDate } from '../../../../lib/orders-db';
import { MONTHS } from '../../../../lib/orderStore';
import { MENU_PRICING } from '../../../../lib/pricingData';
import { ALLERGY_LABELS } from '../../../../lib/mockOrders';

export const dynamic = 'force-dynamic';

const CHEF = "Chef's Choice";
const A4 = [595.28, 841.89];

// ── Workbook geometry ───────────────────────────────────────────────────────
const MARGIN = 0.19685039370078738 * 72;          // 14.17pt, as in the workbook
const chToPt = (w) => Math.round(w * 7 + 5) * 0.75;

const EXCEL_COLS = [22.0, 15.75, 35.13];          // name, class, meal
const EXCEL_GAP = 2.0;                            // the spacer column D
const EXCEL_TITLE_H = 24.0;
const EXCEL_HEADER_H = 15.75;
const EXCEL_ROW_H = 37.5;

/// WinAnsi only: pdf-lib's standard fonts cannot draw CJK and would throw
/// mid-page. A dropped glyph is survivable, a 500 on the kitchen's sheet is
/// not — so the workbook's bilingual labels render in English here.
const ascii = (s) => String(s ?? '').replace(/[^\x20-\x7E]/g, '').trim();

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
/// division whose name already carries its group. The workbook writes these
/// uppercased, so match it.
function classLabel(o) {
  const label = !o.year ? o.dept : (o.year.startsWith(o.dept) ? o.year : `${o.dept} ${o.year}`);
  return label.toUpperCase();
}

function allergyText(o) {
  const chips = (o.allergies ?? []).map(a => ALLERGY_LABELS[a]?.en).filter(Boolean);
  const note = ascii(o.note);
  if (!chips.length && !note) return '';
  return `! ${[...new Set([...chips, note])].filter(Boolean).join(', ')}`;
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
  // The workbook titles its sheets "Monday - 14 September 2026".
  const title = `${WD[dateObj.getDay()]} - ${date} ${MONTH_EN[meta.month]} ${meta.year}`;

  const bySlot = (slot) => rows
    .filter(o => o[slot])
    .sort((a, b) => mealLabel(a, slot).localeCompare(mealLabel(b, slot))
      || a.name.localeCompare(b.name));

  // Always two column groups of identical width, as every sheet in the
  // workbook has. Friday has only one meal, and the workbook heads BOTH halves
  // "Brunch" and runs the one list down the left then the right — it does not
  // widen the columns, which is what stretching a single group would do.
  let groups;
  if (isFriday) {
    const list = bySlot('brunch');
    const half = Math.ceil(list.length / 2);
    groups = [
      { slot: 'brunch', label: 'Brunch', list: list.slice(0, half) },
      { slot: 'brunch', label: 'Brunch', list: list.slice(half) },
    ];
  } else {
    groups = [
      { slot: 'breakfast', label: 'Breakfast', list: bySlot('breakfast') },
      { slot: 'lunch', label: 'Lunch', list: bySlot('lunch') },
    ];
  }

  // ── Fit to width exactly as Excel does ────────────────────────────────────
  const [PW, PH] = A4;
  const usableW = PW - MARGIN * 2;
  const groupPt = EXCEL_COLS.reduce((s, w) => s + chToPt(w), 0);
  const gapPt = chToPt(EXCEL_GAP);
  const contentPt = groupPt * 2 + gapPt;
  const scale = usableW / contentPt;

  const cw = EXCEL_COLS.map(w => chToPt(w) * scale);
  const gap = gapPt * scale;
  const groupW = cw.reduce((s, w) => s + w, 0);
  const titleH = EXCEL_TITLE_H * scale;
  const headerH = EXCEL_HEADER_H * scale;
  const rowH = EXCEL_ROW_H * scale;

  // Centred, matching printOptions horizontalCentered="1". With two equal
  // groups this comes out flush to the margins.
  const leftEdge = MARGIN + (usableW - (groupW * 2 + gap)) / 2;

  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const NAME_SIZE = 8;
  const SIZE = 6.8;
  const LEAD = 8.2;
  const PAD = 2.5;
  const RULE = rgb(0, 0, 0);
  const HAIR = 0.5;

  let page = null;
  let y = 0;

  const groupX = (gi) => leftEdge + gi * (groupW + gap);

  /// Thin box on all four sides, as in the workbook — these are the cut lines.
  const box = (x, top, w, h) => {
    page.drawRectangle({
      x, y: top - h, width: w, height: h,
      borderWidth: HAIR, borderColor: RULE,
    });
  };

  const startPage = () => {
    page = pdf.addPage(A4);
    y = PH - MARGIN;

    page.drawText(ascii(title), {
      x: leftEdge, y: y - titleH + 4, size: 12, font: bold,
    });
    y -= titleH;

    groups.forEach((g, gi) => {
      const x0 = groupX(gi);
      ['Name', 'Class', g.label].forEach((h, hi) => {
        const x = x0 + cw.slice(0, hi).reduce((s, w) => s + w, 0);
        box(x, y, cw[hi], headerH);
        page.drawText(h, { x: x + PAD, y: y - headerH + 3, size: SIZE, font: bold });
      });
    });
    y -= headerH;
  };

  startPage();

  const maxRows = Math.max(...groups.map(g => g.list.length));
  for (let i = 0; i < maxRows; i++) {
    // Lay the text out first: the workbook's 37.5pt is the row height, but a
    // long dish plus an allergy note can need more, and clipping a warning off
    // the kitchen's sticker is not an acceptable way to keep the grid tidy.
    const cells = groups.map(g => {
      const o = g.list[i];
      if (!o) return null;
      const nameLines = wrap(o.name, bold, NAME_SIZE, cw[0] - PAD * 2);
      const alText = allergyText(o);
      const alLines = alText ? wrap(alText, bold, SIZE - 0.3, cw[0] - PAD * 2) : [];
      const classLines = wrap(classLabel(o), font, SIZE, cw[1] - PAD * 2);
      const mealLines = wrap(mealLabel(o, g.slot), font, SIZE, cw[2] - PAD * 2);
      return { o, nameLines, alLines, classLines, mealLines };
    });

    const needed = Math.max(...cells.map(c => c
      ? Math.max((c.nameLines.length + c.alLines.length), c.classLines.length, c.mealLines.length) * LEAD + PAD * 2
      : 0), 0);
    const h = Math.max(rowH, needed);

    if (y - h < MARGIN) startPage();

    groups.forEach((g, gi) => {
      const x0 = groupX(gi);
      const cell = cells[gi];
      // Boxes are drawn for every row, filled or not, so the grid stays whole
      // when one column runs out before the other.
      for (let ci = 0; ci < 3; ci++) {
        box(x0 + cw.slice(0, ci).reduce((s, w) => s + w, 0), y, cw[ci], h);
      }
      if (!cell) return;

      let ty = y - PAD - NAME_SIZE;
      for (const line of cell.nameLines) {
        page.drawText(line, { x: x0 + PAD, y: ty, size: NAME_SIZE, font: bold });
        ty -= LEAD;
      }
      for (const line of cell.alLines) {
        page.drawText(line, { x: x0 + PAD, y: ty, size: SIZE - 0.3, font: bold, color: rgb(0.75, 0.05, 0.05) });
        ty -= LEAD;
      }

      let cy = y - PAD - SIZE;
      for (const line of cell.classLines) {
        page.drawText(line, { x: x0 + cw[0] + PAD, y: cy, size: SIZE, font, color: rgb(0.3, 0.3, 0.3) });
        cy -= LEAD;
      }

      let my = y - PAD - SIZE;
      for (const line of cell.mealLines) {
        page.drawText(line, { x: x0 + cw[0] + cw[1] + PAD, y: my, size: SIZE, font });
        my -= LEAD;
      }
    });

    y -= h;
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
