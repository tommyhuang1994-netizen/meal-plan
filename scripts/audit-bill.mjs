// Checks the monthly bill against the school's stated pricing rules and the
// class-group calendars. Run: node scripts/audit-bill.mjs

import { servingDays, getOrdersForDate } from '../lib/orderStore.js';
import { monthlyBill } from '../lib/billing.js';
import { rowCharges, CHEF_LABEL } from '../lib/pricing.js';
import { MENU_PRICING } from '../lib/pricingData.js';
import { isDateAvailable } from '../lib/schoolCalendar.js';

const KEY = '2026-09';
const bill = monthlyBill(KEY);
console.log('serving days used by billing:', bill.servingDays);
console.log('order-days billed:', bill.orderedDays, '| parent RM', bill.parentTotal.toFixed(2), '| vendor RM', bill.vendorTotal.toFixed(2));
console.log('groups:', bill.groups.map(g => `${g.dept}:${g.days}d/RM${g.parent.toFixed(2)}`).join('  '));

// 1. Are students billed on dates their own class group is blocked?
let offCalendar = 0; const offBy = {};
for (const d of servingDays(KEY)) {
  for (const r of getOrdersForDate(KEY, d)) {
    if (!isDateAvailable(r.dept, d)) { offCalendar++; offBy[r.dept] = (offBy[r.dept] ?? 0) + 1; }
  }
}
console.log('\n[1] order-days on dates the group is BLOCKED:', offCalendar, JSON.stringify(offBy));

// 2. Dish names on orders with no price entry -> silently billed RM 0
const missing = new Map();
for (const d of servingDays(KEY)) {
  for (const r of getOrdersForDate(KEY, d)) {
    for (const slot of ['breakfast', 'lunch', 'brunch']) {
      const n = r[slot];
      if (!n || n === CHEF_LABEL) continue;
      if (!MENU_PRICING[n]) missing.set(n, (missing.get(n) ?? 0) + 1);
    }
  }
}
console.log('[2] dish names with NO price entry:', missing.size, [...missing.entries()].slice(0, 8));

// 3. Do per-student sums equal the headline total?
const sum = bill.students.reduce((s, x) => s + x.parent, 0);
console.log('[3] students sum RM', sum.toFixed(2), '| headline RM', bill.parentTotal.toFixed(2),
  sum.toFixed(2) === bill.parentTotal.toFixed(2) ? 'MATCH' : 'MISMATCH');

// 4. Spot-check the stated pricing rules
const chk = [
  [{ breakfast: CHEF_LABEL, lunch: CHEF_LABEL, brunch: null }, 18.00, 'chef both   -> 18.00'],
  [{ breakfast: CHEF_LABEL, lunch: null, brunch: null }, 7.00, 'chef bf     ->  7.00'],
  [{ breakfast: null, lunch: CHEF_LABEL, brunch: null }, 12.00, 'chef lunch  -> 12.00'],
  [{ breakfast: null, lunch: null, brunch: CHEF_LABEL }, 12.00, 'chef brunch -> 12.00'],
];
console.log('\n[4] rule spot-checks');
for (const [row, want, label] of chk) {
  const got = rowCharges(row).parent;
  console.log(`   ${label}  got ${got.toFixed(2)}  ${got === want ? 'ok' : 'WRONG'}`);
}

// 5. Friday handling
let friBad = 0;
for (const d of servingDays(KEY)) {
  if (new Date(2026, 8, d).getDay() !== 5) continue;
  for (const r of getOrdersForDate(KEY, d)) if (r.breakfast || r.lunch) friBad++;
}
console.log('\n[5] Friday rows carrying breakfast/lunch instead of brunch:', friBad);
