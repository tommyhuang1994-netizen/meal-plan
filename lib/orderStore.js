// Shared order store — the one place both portals talk to.
//
// The parent order page WRITES here on submit; the vendor dashboard READS from
// here. That is what makes a parent's order show up in the vendor view without
// a database behind it.
//
// Two layers:
//   1. Sample orders for August + September 2026, generated deterministically
//      below so the vendor has something to look at from a cold start.
//   2. Orders a parent actually submits, persisted to localStorage and merged
//      on top of the samples.
//
// localStorage is per-browser, so a parent order is visible to the vendor on
// the same device only. Replace this module with real queries once the API
// routes are wired — the shape returned here matches what OrderDay/OrderMeal
// would give back, so the vendor page should not need changing.

import { MENU_BY_DATE } from './menuData.js';
import { STUDENTS } from './students.js';
import { isDateLocked } from './cutoff.js';
import { rowCharges } from './pricing.js';

const STORAGE_KEY = 'zera_orders_v1';

// Written into a meal slot when the parent left the dish to the kitchen. The
// parent order page writes the same string, so both sources read alike.
export const CHEF_CHOICE = "Chef's Choice";

// The children this parent portal is for. Hardcoded until real accounts exist.
// Which children the parent portal shows. There are no accounts yet, so this
// picks two real students from different class groups — one Cambridge, one
// Homeschool — so their differing calendars are both visible.
export const PARENT_CHILDREN = ['Anston Ho Zi Xue', 'Timothy Ong'];

// ── Months the vendor can browse ─────────────────────────────────────────────
// month is 0-based to match JS Date.
export const MONTHS = [
  { year: 2026, month: 7, key: '2026-08', labelEn: 'August 2026',    labelZh: '2026年8月' },
  { year: 2026, month: 8, key: '2026-09', labelEn: 'September 2026', labelZh: '2026年9月' },
];

export const DEFAULT_MONTH = '2026-09';

export function monthLabel(key, lang = 'en') {
  const m = MONTHS.find(x => x.key === key) ?? MONTHS[0];
  return lang === 'zh' ? m.labelZh : m.labelEn;
}

export function isoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ── Closures ─────────────────────────────────────────────────────────────────
// Dates the kitchen does not serve, by month key. September mirrors
// lib/schoolCalendar.js; August carries only its public holiday, since no
// class-group calendar exists for a month outside the ordering cycle.
const CLOSED = {
  '2026-08': { 31: 'Merdeka Day' },
  '2026-09': { 16: 'Malaysia Day' },
};

export function closedReason(monthKey, day) {
  return CLOSED[monthKey]?.[day] ?? null;
}

/// Serving days in a month: weekdays that are not a closure.
export function servingDays(monthKey) {
  const m = MONTHS.find(x => x.key === monthKey);
  if (!m) return [];
  const total = new Date(m.year, m.month + 1, 0).getDate();
  const out = [];
  for (let d = 1; d <= total; d++) {
    const dow = new Date(m.year, m.month, d).getDay();
    if (dow === 0 || dow === 6) continue;
    if (closedReason(monthKey, d)) continue;
    out.push(d);
  }
  return out;
}

// ── Roster ───────────────────────────────────────────────────────────────────
// The real roster from the September 2026 form responses. See lib/students.js
// for what did and did not survive the import — allergies in particular.
export const ROSTER = STUDENTS;

// ── Deterministic sample generation ──────────────────────────────────────────
// A seeded PRNG keeps the samples identical on every render and between the
// server and client, which a Math.random() version would not.
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const hashCode = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

// Dishes to draw from. September uses that date's real menu; August has no
// published menu, so it reuses the September catalogue as stand-in sample data.
function catalogue() {
  const bf = new Set(), ln = new Set(), br = new Set();
  for (const day of Object.values(MENU_BY_DATE)) {
    for (const i of day.breakfast ?? []) bf.add(i.name);
    for (const i of day.lunch     ?? []) ln.add(i.name);
    for (const i of day.brunch    ?? []) br.add(i.name);
  }
  return { breakfast: [...bf], lunch: [...ln], brunch: [...br] };
}
const CATALOGUE = catalogue();

function dishesFor(iso, isFriday) {
  const day = MENU_BY_DATE[iso];
  if (day) {
    return {
      breakfast: (day.breakfast ?? []).map(i => i.name),
      lunch:     (day.lunch     ?? []).map(i => i.name),
      brunch:    (day.brunch    ?? []).map(i => i.name),
    };
  }
  // No published menu for this date (August) — fall back to the catalogue.
  return isFriday
    ? { breakfast: [], lunch: [], brunch: CATALOGUE.brunch }
    : { breakfast: CATALOGUE.breakfast, lunch: CATALOGUE.lunch, brunch: [] };
}

/// Sample orders for one date. Roughly two thirds of the roster orders on a
/// given day; on Fridays everyone who orders takes brunch.
function sampleOrdersFor(monthKey, day) {
  const m = MONTHS.find(x => x.key === monthKey);
  if (!m) return [];
  const iso = isoDate(m.year, m.month, day);
  const dow = new Date(m.year, m.month, day).getDay();
  const isFriday = dow === 5;
  const pool = dishesFor(iso, isFriday);
  const rng = makeRng(hashCode(iso));

  const rows = [];
  for (const student of ROSTER) {
    if (rng() > 0.68) continue;                       // not ordering today
    const row = {
      id: `sample-${iso}-${student.name}`,
      date: iso,
      name: student.name,
      dept: student.dept,
      year: student.year,
      allergies: student.allergies,
      breakfast: null,
      lunch: null,
      brunch: null,
      source: 'sample',
    };
    const pick = (arr) => (arr.length ? arr[Math.floor(rng() * arr.length)] : null);
    // Roughly half the roster is on a Chef's Choice plan, which is what the
    // kitchen sees most of; the rest pick dishes themselves.
    const chef = rng() < 0.5;
    if (isFriday) {
      row.brunch = chef ? CHEF_CHOICE : pick(pool.brunch);
      if (!row.brunch) continue;
    } else {
      const roll = rng();
      if (roll < 0.55) {
        row.breakfast = chef ? CHEF_CHOICE : pick(pool.breakfast);
        row.lunch     = chef ? CHEF_CHOICE : pick(pool.lunch);
      } else if (roll < 0.78) {
        row.lunch     = chef ? CHEF_CHOICE : pick(pool.lunch);
      } else {
        row.breakfast = chef ? CHEF_CHOICE : pick(pool.breakfast);
      }
      if (!row.breakfast && !row.lunch) continue;
    }
    rows.push(row);
  }
  return rows;
}

// ── Parent-submitted orders (localStorage) ───────────────────────────────────

function readSubmitted() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];               // private mode, cleared storage, corrupt JSON
  }
}

function writeSubmitted(rows) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)); } catch { /* quota / blocked */ }
}

/// Replace every stored row for this student in this month, then add the new
/// ones — so re-submitting an order updates it instead of duplicating it.
export function saveParentOrder({ studentName, dept, year, allergies = [], allergyNote = '', days = [], total = 0, planLabel = '', planCode = 'custom' }) {
  const rows = readSubmitted();
  const months = new Set(days.map(d => d.date.slice(0, 7)));

  // Re-ordering replaces this student's days for the month — except the ones
  // already past their cut-off. The kitchen is committed to those, so they
  // survive the change rather than silently vanishing from the order.
  const kept = rows.filter(r => !(
    r.name === studentName && months.has(r.date.slice(0, 7)) && !isDateLocked(r.date)
  ));

  for (const d of days) {
    if (isDateLocked(d.date)) continue;          // cannot be changed any more
    kept.push({
      id: `parent-${d.date}-${studentName}`,
      date: d.date,
      name: studentName,
      dept,
      year,
      allergies,
      breakfast: d.breakfast ?? null,
      lunch:     d.lunch ?? null,
      brunch:    d.brunch ?? null,
      price:     d.price ?? 0,
      sel:       d.sel ?? null,      // raw slots, so the order can be re-opened
      source: 'parent',
    });
  }
  writeSubmitted(kept);

  // One receipt per student per month. Totals are summed from the rows that
  // actually survived, so a locked day the parent kept is still billed and a
  // dropped day is not — the receipt can never disagree with the day list.
  const receipts = readReceipts().filter(
    r => !(r.studentName === studentName && months.has(r.monthKey))
  );
  for (const monthKey of months) {
    const mine = kept.filter(r => r.name === studentName && r.date.slice(0, 7) === monthKey);
    if (!mine.length) continue;
    receipts.push({
      id: `${monthKey}-${studentName}`,
      monthKey,
      studentName,
      classGroup: dept,
      division: year,
      planLabel,
      planCode,
      allergies,
      allergyNote,
      dayCount: mine.length,
      total: mine.reduce((s, r) => s + (r.price ?? 0), 0),
      submittedAt: new Date().toISOString(),
    });
  }
  writeReceipts(receipts);
  return kept.length;
}

export function clearParentOrders() {
  writeSubmitted([]);
  writeReceipts([]);
}

// ── Parent receipts ──────────────────────────────────────────────────────────

const RECEIPTS_KEY = 'zera_receipts_v1';

function readReceipts() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECEIPTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeReceipts(rows) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(RECEIPTS_KEY, JSON.stringify(rows)); } catch { /* blocked */ }
}

/// Every order this browser has placed, newest month first.
export function getParentOrders() {
  return readReceipts().sort(
    (a, b) => b.monthKey.localeCompare(a.monthKey) || a.studentName.localeCompare(b.studentName)
  );
}

/// The day-by-day breakdown behind one receipt, oldest date first.
export function getParentOrderDetail(studentName, monthKey) {
  return readSubmitted()
    .filter(r => r.name === studentName && r.date.slice(0, 7) === monthKey)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/// Everything needed to re-open a placed order in the order form: the class,
/// the plan, the allergy answers and the exact per-date selections. Returns
/// null when this student has not ordered for that month.
export function getParentOrderForEdit(studentName, monthKey) {
  const receipt = readReceipts().find(
    r => r.studentName === studentName && r.monthKey === monthKey
  );
  if (!receipt) return null;

  const dateSelections = {};
  for (const row of getParentOrderDetail(studentName, monthKey)) {
    if (row.sel) dateSelections[row.date] = row.sel;
  }
  return {
    classGroup: receipt.classGroup ?? null,
    division:   receipt.division ?? null,
    planCode:   receipt.planCode ?? 'custom',
    allergies:  receipt.allergies ?? [],
    allergyNote: receipt.allergyNote ?? '',
    dateSelections,
  };
}

/// Replace one day of a placed order. Used by the per-day "Change" sheet on
/// /parent. Refuses a date that is past its cut-off, and re-totals the receipt
/// from the surviving rows so it always equals its own line items.
export function updateParentOrderDay({ studentName, monthKey, date, sel, breakfast, lunch, brunch, price }) {
  if (isDateLocked(date)) return { ok: false, reason: 'locked' };

  const rows = readSubmitted();
  const existing = rows.find(r => r.name === studentName && r.date === date);
  if (!existing) return { ok: false, reason: 'not-found' };

  const updated = rows.map(r => (r === existing
    ? { ...r, sel, breakfast: breakfast ?? null, lunch: lunch ?? null, brunch: brunch ?? null, price }
    : r));
  writeSubmitted(updated);

  const mine = updated.filter(r => r.name === studentName && r.date.slice(0, 7) === monthKey);
  writeReceipts(readReceipts().map(r => (
    r.studentName === studentName && r.monthKey === monthKey
      ? { ...r, dayCount: mine.length, total: mine.reduce((sum, x) => sum + (x.price ?? 0), 0) }
      : r
  )));
  return { ok: true };
}

/// The day-by-day breakdown for any month on record — the school's own rows as
/// well as anything placed through the portal. getParentOrderDetail() above
/// covers only portal rows, which is what the cancel flow wants.
export function getStudentOrderDetail(studentName, monthKey) {
  const meta = MONTHS.find(m => m.key === monthKey);
  if (!meta) return [];
  const rows = [];
  for (const day of servingDays(monthKey)) {
    for (const r of getOrdersForDate(monthKey, day)) {
      if (r.name !== studentName) continue;
      rows.push({ ...r, price: r.price ?? rowCharges(r).parent });
    }
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

/// Every month this student has meals on record for, newest first — not just
/// the ones placed through this browser. A family's earlier months come from
/// the school's own records, so a parent can look back at what was ordered
/// rather than only seeing the order they happen to have placed here.
export function getStudentOrders(studentNames = PARENT_CHILDREN) {
  const wanted = new Set(studentNames);
  const byKey = new Map();

  for (const m of MONTHS) {
    for (const day of servingDays(m.key)) {
      for (const row of getOrdersForDate(m.key, day)) {
        if (!wanted.has(row.name)) continue;
        const id = `${m.key}-${row.name}`;
        const rec = byKey.get(id) ?? {
          id,
          monthKey: m.key,
          studentName: row.name,
          classGroup: row.dept,
          division: row.year,
          allergies: row.allergies ?? [],
          dayCount: 0,
          total: 0,
          fromPortal: false,
          chefDays: 0,
        };
        rec.dayCount += 1;
        // Parent-placed days carry the price they were quoted; days from the
        // school's records are priced the same way the bill prices them.
        rec.total += row.price ?? rowCharges(row).parent;
        if (row.source === 'parent') rec.fromPortal = true;
        if (row.breakfast === CHEF_CHOICE || row.lunch === CHEF_CHOICE || row.brunch === CHEF_CHOICE) rec.chefDays += 1;
        byKey.set(id, rec);
      }
    }
  }

  // Attach the plan wording from the receipt when this browser placed it.
  const receipts = readReceipts();
  for (const rec of byKey.values()) {
    const r = receipts.find(x => x.studentName === rec.studentName && x.monthKey === rec.monthKey);
    if (r?.planLabel) rec.planLabel = r.planLabel;
  }

  return [...byKey.values()].sort(
    (a, b) => b.monthKey.localeCompare(a.monthKey) || a.studentName.localeCompare(b.studentName)
  );
}

/// Cancel one student's order for one month: drops the parent's receipt and
/// every day row behind it, so the vendor stops seeing those meals too. Used by
/// the admin when a parent asks for a cancellation.
export function cancelParentOrder(studentName, monthKey) {
  const days = readSubmitted();
  const keptDays = days.filter(
    r => !(r.name === studentName && r.date.slice(0, 7) === monthKey)
  );
  const removed = days.length - keptDays.length;
  writeSubmitted(keptDays);

  writeReceipts(
    readReceipts().filter(r => !(r.studentName === studentName && r.monthKey === monthKey))
  );
  return removed;
}

// ── Read API (what the vendor page uses) ─────────────────────────────────────

/// All orders for one date. Parent submissions replace the sample row for the
/// same student so a person never appears twice.
export function getOrdersForDate(monthKey, day) {
  const m = MONTHS.find(x => x.key === monthKey);
  if (!m || closedReason(monthKey, day)) return [];
  const iso = isoDate(m.year, m.month, day);

  const submitted = readSubmitted().filter(r => r.date === iso);
  const names = new Set(submitted.map(r => r.name));
  const samples = sampleOrdersFor(monthKey, day).filter(r => !names.has(r.name));
  return [...submitted, ...samples].sort((a, b) => a.name.localeCompare(b.name));
}

/// Order count per day, for the calendar dots. Cheap enough to call per render.
export function getOrderCounts(monthKey) {
  const counts = {};
  for (const d of servingDays(monthKey)) counts[d] = getOrdersForDate(monthKey, d).length;
  return counts;
}
