// Generates lib/menuData.js + the MENU_PRICING block from the live Google Form.
// Read-only against the form: GETs the viewform HTML, never posts.
import { writeFileSync } from 'node:fs';

const URL_ = 'https://docs.google.com/forms/d/e/1FAIpQLSdUicrOyRxHI0i18dN-QfpWIAfWBRpzy84kqfurvSUOjuy-9A/viewform';
const html = await (await fetch(URL_, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
const data = JSON.parse(html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);\s*<\/script>/)[1]);

const MEALS = { Breakfast: 'breakfast', Lunch: 'lunch', Brunch: 'brunch' };
const byDate = {};      // "2026-09-01" -> { breakfast: [...] }
const prices = {};      // name -> { type, price }
const collisions = [];

for (const it of data[1][1]) {
  const [, rawTitle, , type, opts] = it;
  if (type !== 3 || !rawTitle) continue;                      // dropdowns only
  const title = rawTitle.replace(/\s+/g, ' ').trim();
  const dm = title.match(/(\d+)(?:st|nd|rd|th)\s+September\s+2026/i);
  const mm = title.match(/\b(Breakfast|Lunch|Brunch)\b/i);
  if (!dm || !mm) continue;

  const day  = Number(dm[1]);
  const meal = MEALS[mm[1][0].toUpperCase() + mm[1].slice(1).toLowerCase()];
  const key  = `2026-09-${String(day).padStart(2, '0')}`;
  const items = [];

  for (const o of opts ?? []) {
    for (const c of o?.[1] ?? []) {
      const raw = (c?.[0] ?? '').replace(/\s+/g, ' ').trim();
      if (!raw || /^-?\s*None\s*-?$/i.test(raw)) continue;
      const pm = raw.match(/^RM\s*(\d+(?:\.\d+)?)\s*-\s*(.+)$/i);
      if (!pm) { console.warn('  UNPARSED:', raw); continue; }
      const price = Number(pm[1]);
      let full = pm[2].trim();

      // The school marks vegetarian dishes with 🥬, but drops it at the end of
      // whichever clause — strip it wherever it lands and re-attach to the name.
      const veg = full.includes('🥬');
      full = full.replace(/🥬/g, '').replace(/\s+/g, ' ').trim();

      // Split "X served with Y" into name + description; otherwise it is all name.
      let name = full, desc = '';
      const sm = full.match(/^(.+?)\s+served\s+with\s+(.+)$/i);
      if (sm && sm[1].length >= 4) { name = sm[1].trim(); desc = 'Served with ' + sm[2].trim(); }
      if (veg) name += ' 🥬';

      const prev = prices[name];
      if (prev && (prev.type !== meal || prev.price !== price)) {
        collisions.push(`${name}: ${prev.type}/RM${prev.price} vs ${meal}/RM${price}`);
      }
      prices[name] = { type: meal, price };
      // MealItems marks a row selected with `selected === item.id`, so every
      // option needs its own id — without one, undefined === undefined ticks
      // every row at once. Index keeps it unique within the date + meal.
      const slug = name.replace(/[^A-Za-z0-9]/g, '');
      items.push({ id: `${meal}-${items.length}-${slug}`, name, desc, price });
    }
  }
  if (!items.length) continue;                                 // closed day
  (byDate[key] ??= {})[meal] = items;
}

const days = Object.keys(byDate).sort();
console.log(`dates with a menu: ${days.length}`);
console.log(`distinct dishes  : ${Object.keys(prices).length}`);
console.log(`collisions       : ${collisions.length}`);
for (const c of collisions) console.log('  !', c);

const q = s => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const pad = (s, n) => s + ' '.repeat(Math.max(0, n - s.length));

// ── lib/menuData.js ──────────────────────────────────────────────────────────
let out = `// Per-date menu data for September 2026.
// GENERATED from the ZERA Meal Plan September 2026 Google Form — dish names,
// descriptions and prices are the school's own wording. Regenerate rather than
// hand-edit when the form changes.
//
// Mon-Thu have breakfast + lunch; Friday is brunch only. Dates the kitchen is
// closed (public holidays, group holidays) simply have no entry here.

export const MENU_BY_DATE = {
`;
for (const d of days) {
  out += `  ${q(d)}: {\n`;
  for (const meal of ['breakfast', 'lunch', 'brunch']) {
    const items = byDate[d][meal];
    if (!items) continue;
    out += `    ${meal}: [\n`;
    for (const i of items) {
      out += `      { id: ${pad(q(i.id) + ',', 46)} name: ${pad(q(i.name) + ',', 46)} desc: ${pad(q(i.desc) + ',', 62)} price: ${i.price.toFixed(2)} },\n`;
    }
    out += `    ],\n`;
  }
  out += `  },\n`;
}
out += `};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getSchoolDays() {
  return Object.keys(MENU_BY_DATE).map(k => parseInt(k.split('-')[2])).sort((a, b) => a - b);
}

export function isFridayDate(date) {
  return new Date(2026, 8, date).getDay() === 5;
}

export function dateKey(date) {
  return \`2026-09-\${String(date).padStart(2, '0')}\`;
}

export function dayLabel(date) {
  const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return names[new Date(2026, 8, date).getDay()];
}

export function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
`;
writeFileSync('lib/menuData.js', out);

// ── MENU_PRICING block ───────────────────────────────────────────────────────
// Vendor costs for the à-la-carte ("I'll Choose") meals, supplied by the school.
// A flat RM 1.00 margin on each against the form's parent prices.
const VENDOR_COST = {
  breakfast: 6.00,
  lunch:     11.00,
  brunch:    11.00,  // school: "Friday brunch cost same as I'll Choose lunch"
};
const order = { breakfast: 0, lunch: 1, brunch: 2 };
const names = Object.keys(prices).sort((a, b) =>
  (order[prices[a].type] - order[prices[b].type]) || a.localeCompare(b));
const width = Math.max(...names.map(n => q(n).length)) + 1;

let pr = '';
let lastType = null;
for (const n of names) {
  const { type, price } = prices[n];
  if (type !== lastType) { pr += `  // ${type[0].toUpperCase() + type.slice(1)} items\n`; lastType = type; }
  const label = type[0].toUpperCase() + type.slice(1);
  const vc = VENDOR_COST[type];
  const vcText = vc === null || vc === undefined ? 'null' : vc.toFixed(2);
  pr += `  ${pad(q(n) + ':', width + 1)} { type: ${pad(q(label) + ',', 13)} vendorCost: ${pad(vcText + ',', 7)} parentPrice: ${price.toFixed(2)} },\n`;
}
const pricing = `// Pricing data: vendor cost vs parent price for all items
// vendorCost = what the school pays the vendor
// parentPrice = what parents are charged (includes markup)

// ── Chef's Choice plans ───────────────────────────────────────────────────────

// September 2026 rates, from the school.
//
// A single Chef's Choice meal costs the parent exactly what the same meal costs
// a-la-carte: breakfast RM 7.00, lunch RM 12.00, Friday brunch RM 12.00. The one
// discount in the system is the both-meals promotion — take Chef's Choice for
// BOTH breakfast and lunch on a weekday and the pair is RM 18.00 instead of
// RM 19.00. It applies to chef+chef only, never to a-la-carte picks.
//
// chefs_both vendorCost is the sum of its two halves (6.00 + 10.50); every other
// cost was given directly.
export const CHEFS_PRICING = [
  { id: 'chefs_both',    label: "Chef's Choice",     note: 'Breakfast & Lunch (promo)',         vendorCost: 16.50, parentPrice: 18.00 },
  { id: 'chefs_bf',      label: "Chef's Choice",     note: 'Breakfast only',                    vendorCost: 6.00,  parentPrice: 7.00  },
  { id: 'chefs_ln',      label: "Chef's Choice",     note: 'Lunch only',                        vendorCost: 10.50, parentPrice: 12.00 },
  { id: 'chefs_brunch',  label: "Chef's Choice",     note: 'Friday Brunch',                     vendorCost: 11.00, parentPrice: 12.00 },
  // Whole-month version of the both-meals promo, charged per study day. Weekdays
  // bill at this rate; Fridays have no breakfast/lunch, so they bill at the
  // brunch rate instead (see calcChild).
  { id: 'chefs_set_daily', label: "Chef's Choice Meal Set", note: 'Both meals · Chef\\'s Choice · per study day (promo rate)', vendorCost: 16.50, parentPrice: 18.00 },
];

// Per-study-day promo rate for the "Chef's Choice Meal Set" (read by the parent
// order page). Multiply by the class group's available days for the month total.
export const MEAL_SET_DAILY_PRICE = CHEFS_PRICING.find(p => p.id === 'chefs_set_daily')?.parentPrice ?? 0;

// ── A la carte menu items ─────────────────────────────────────────────────────
// GENERATED from the ZERA Meal Plan September 2026 Google Form alongside
// lib/menuData.js. parentPrice is the school's published price — this is what
// parents see and select on.
//
// vendorCost comes from the school's cost list: RM 6.00 breakfast, RM 11.00
// lunch, RM 11.00 Friday brunch — a flat RM 1.00 margin on every a-la-carte
// meal. Only /admin/prices consumes cost; it renders any unknown one as "—"
// rather than a fake markup.

export const MENU_PRICING = {
${pr}};
`;
writeFileSync('lib/pricingData.js', pricing);
console.log('\nwrote lib/menuData.js and lib/pricingData.js');
