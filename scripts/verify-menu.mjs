import { MENU_BY_DATE, isFridayDate, dateKey, dayLabel } from '../lib/menuData.js';
import { MENU_PRICING, CHEFS_PRICING, MEAL_SET_DAILY_PRICE } from '../lib/pricingData.js';
import { getAvailableDays, isDateAvailable, getHolidayInfo, getBlockedDaysList, CALENDAR_GROUPS } from '../lib/schoolCalendar.js';

let fail = 0;
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`}`);
};

console.log('— Calendar shape —');
check('Sep 1 2026 is a Tuesday', dayLabel(1), "Tuesday");
check('Sep 4 is a Friday',       isFridayDate(4), true);
check('date key format',         dateKey(4), '2026-09-04');

console.log('\n— Available days per group —');
const days = Object.fromEntries(Object.keys(CALENDAR_GROUPS).map(g => [g, getAvailableDays(g)]));
check('Cambridge  (only Malaysia Day blocked)', days.Cambridge.length, 21);
check('Staff      (only Malaysia Day blocked)', days.Staff.length,     21);
check('Homeschool (Sep 4 + 14-18 blocked)',     days.Homeschool.length, 16);
check('Plus       (Sep 4 + 7-11 + 16 blocked)', days.Plus.length,       15);

console.log('\n— Closures from the form —');
check('Malaysia Day blocked for Cambridge',  isDateAvailable('Cambridge', 16), false);
check('Malaysia Day blocked for Plus',       isDateAvailable('Plus', 16),      false);
check('Sep 4 open for Cambridge',            isDateAvailable('Cambridge', 4),  true);
check('Sep 4 blocked for Homeschool',        isDateAvailable('Homeschool', 4), false);
check('Sep 4 blocked for Plus',              isDateAvailable('Plus', 4),       false);
check('Sep 9 blocked for Plus only',        [isDateAvailable('Plus',9), isDateAvailable('Homeschool',9)], [false, true]);
check('Sep 15 blocked for Homeschool only', [isDateAvailable('Homeschool',15), isDateAvailable('Plus',15)], [false, true]);
check('Malaysia Day is named',               getHolidayInfo('Cambridge', 16)?.name, 'Malaysia Day');

console.log('\n— Menu coverage —');
const keys = Object.keys(MENU_BY_DATE);
check('dates carrying a menu', keys.length, 21);
check('Malaysia Day has no menu', MENU_BY_DATE['2026-09-16'], undefined);
check('Sep 1 breakfast options', MENU_BY_DATE['2026-09-01'].breakfast.length, 2);
check('Sep 1 lunch options',     MENU_BY_DATE['2026-09-01'].lunch.length, 3);
check('Friday Sep 4 is brunch-only', Object.keys(MENU_BY_DATE['2026-09-04']), ['brunch']);

// Every Cambridge-available day must have a menu, and vice versa.
const availSet = new Set(days.Cambridge.map(dateKey));
check('every Cambridge day has a menu', days.Cambridge.filter(d => !MENU_BY_DATE[dateKey(d)]), []);
check('every menu date is orderable',   keys.filter(k => !availSet.has(k)), []);

console.log('\n— Item ids (single-select depends on these) —');
// MealItems does `selected === item.id`. A missing id makes every row compare
// undefined === undefined and tick all at once.
const noId = [], dupes = [];
for (const [k, meals] of Object.entries(MENU_BY_DATE)) {
  for (const [meal, items] of Object.entries(meals)) {
    const seen = new Set();
    for (const i of items) {
      if (!i.id) noId.push(`${k} ${meal} ${i.name}`);
      if (seen.has(i.id)) dupes.push(`${k} ${meal} ${i.id}`);
      seen.add(i.id);
    }
  }
}
check('every option has an id', noId, []);
check('ids unique within a meal', dupes, []);

console.log('\n— Prices —');
const bf = Object.entries(MENU_PRICING).filter(([, v]) => v.type === 'Breakfast');
const ln = Object.entries(MENU_PRICING).filter(([, v]) => v.type === 'Lunch');
const br = Object.entries(MENU_PRICING).filter(([, v]) => v.type === 'Brunch');
check('all breakfast are RM 7',      [...new Set(bf.map(([, v]) => v.parentPrice))], [7]);
check('all lunch are RM 12',         [...new Set(ln.map(([, v]) => v.parentPrice))], [12]);
check('all brunch are RM 12',        [...new Set(br.map(([, v]) => v.parentPrice))], [12]);
check('dish count', Object.keys(MENU_PRICING).length, 46);
const costOf = (t) => [...new Set(Object.values(MENU_PRICING).filter(v => v.type === t).map(v => v.vendorCost))];
check('breakfast vendor cost RM 6.00', costOf('Breakfast'), [6]);
check('lunch vendor cost RM 11.00',    costOf('Lunch'),     [11]);
check('brunch vendor cost RM 11.00',   costOf('Brunch'),    [11]);
check('breakfast margin RM 1.00',      7 - 6,  1);
check('lunch margin RM 1.00',          12 - 11, 1);
check('brunch margin RM 1.00',         12 - 11, 1);
check('every dish now has a cost', Object.entries(MENU_PRICING).filter(([, v]) => v.vendorCost == null).map(([n]) => n), []);

// Every dish on the calendar must exist in the price list.
const missing = [];
for (const [k, meals] of Object.entries(MENU_BY_DATE))
  for (const items of Object.values(meals))
    for (const i of items) if (!MENU_PRICING[i.name]) missing.push(`${k} ${i.name}`);
check('every menu dish is priced', missing, []);

console.log('\n— Chef plans —');
const plan = (id) => CHEFS_PRICING.find(p => p.id === id);
check('plan count', CHEFS_PRICING.length, 5);
// A single chef meal costs the same as the same meal a la carte.
check('chef breakfast = a la carte', plan('chefs_bf').parentPrice,     7);
check('chef lunch = a la carte',     plan('chefs_ln').parentPrice,     12);
check('chef brunch = a la carte',    plan('chefs_brunch').parentPrice, 12);
// The pair promo: RM 18.00 instead of 7 + 12 = 19.
check('both-meals promo price',      plan('chefs_both').parentPrice,   18);
check('promo saves RM 1.00', (7 + 12) - plan('chefs_both').parentPrice, 1);
check('meal set matches the pair rate', MEAL_SET_DAILY_PRICE, 18);
// Every plan must now clear its cost.
check('no chef plan below cost',
  CHEFS_PRICING.filter(p => p.vendorCost != null && p.parentPrice < p.vendorCost).map(p => p.id), []);

// Meal Set month totals: weekdays at the pair rate, Fridays at brunch.
const setTotal = (g) => {
  const d = days[g];
  const fri = d.filter(isFridayDate).length;
  return (d.length - fri) * MEAL_SET_DAILY_PRICE + fri * plan('chefs_brunch').parentPrice;
};
check('Cambridge meal set (17 wk + 4 Fri)',  setTotal('Cambridge'),  17 * 18 + 4 * 12);
check('Homeschool meal set (14 wk + 2 Fri)', setTotal('Homeschool'), 14 * 18 + 2 * 12);
check('Plus meal set (13 wk + 2 Fri)',       setTotal('Plus'),       13 * 18 + 2 * 12);

console.log('\n— Seed will emit —');
const blocks = Object.keys(CALENDAR_GROUPS).flatMap(g => getBlockedDaysList(g));
check('CalendarBlock rows', blocks.length, 1 + 6 + 7 + 1);

console.log('\n— Margin warnings (not failures) —');
let warned = 0;
for (const p of CHEFS_PRICING) {
  if (p.vendorCost != null && p.parentPrice < p.vendorCost) {
    warned++;
    console.log(`  LOSS  ${p.id}: parent RM ${p.parentPrice.toFixed(2)} < cost RM ${p.vendorCost.toFixed(2)} ` +
                `(RM ${(p.vendorCost - p.parentPrice).toFixed(2)}/day)`);
  }
}
for (const [n, v] of Object.entries(MENU_PRICING)) {
  if (v.vendorCost != null && v.parentPrice < v.vendorCost) { warned++; console.log(`  LOSS  ${n}`); }
}
if (!warned) console.log('  none');

console.log(fail === 0 ? '\nAll checks passed.' : `\n${fail} CHECK(S) FAILED.`);
process.exit(fail === 0 ? 0 : 1);
