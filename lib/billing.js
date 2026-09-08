// The monthly bill, from both sides of the same orders.
//
//   Admin  invoices PARENTS       — sum of parentPrice
//   Vendor invoices the SCHOOL    — sum of vendorCost
//
// Both come from one walk of the month's orders, so the two invoices can never
// be computed from different sets of meals. The difference between them is the
// school's margin.

import { MONTHS, servingDays, getOrdersForDate } from './orderStore.js';
import { rowCharges, mealCount, CHEF_LABEL } from './pricing.js';

/// Every order in the month, flattened to one row per student per day.
function monthRows(monthKey) {
  const rows = [];
  for (const day of servingDays(monthKey)) {
    for (const o of getOrdersForDate(monthKey, day)) rows.push(o);
  }
  return rows;
}

/// The month's bill, broken down the ways each side needs to read it.
export function monthlyBill(monthKey) {
  const meta = MONTHS.find(m => m.key === monthKey);
  const rows = meta ? monthRows(monthKey) : [];

  const byStudent = new Map();
  const byGroup   = new Map();
  const byMeal    = { breakfast: 0, lunch: 0, brunch: 0 };
  let parentTotal = 0, vendorTotal = 0, mealsCooked = 0, unknownCostDays = 0;

  for (const r of rows) {
    const { parent, vendor, unknownCost } = rowCharges(r);
    parentTotal += parent;
    vendorTotal += vendor;
    mealsCooked += mealCount(r);
    if (unknownCost) unknownCostDays++;

    for (const slot of ['breakfast', 'lunch', 'brunch']) if (r[slot]) byMeal[slot]++;

    const s = byStudent.get(r.name) ?? {
      name: r.name, dept: r.dept, year: r.year,
      days: 0, meals: 0, parent: 0, vendor: 0, fromParent: false,
    };
    s.days   += 1;
    s.meals  += mealCount(r);
    s.parent += parent;
    s.vendor += vendor;
    if (r.source === 'parent') s.fromParent = true;
    byStudent.set(r.name, s);

    const g = byGroup.get(r.dept) ?? { dept: r.dept, days: 0, parent: 0, vendor: 0 };
    g.days   += 1;
    g.parent += parent;
    g.vendor += vendor;
    byGroup.set(r.dept, g);
  }

  const students = [...byStudent.values()].sort(
    (a, b) => (a.dept ?? '').localeCompare(b.dept ?? '') || a.name.localeCompare(b.name)
  );
  const groups = [...byGroup.values()].sort((a, b) => (a.dept ?? '').localeCompare(b.dept ?? ''));

  return {
    monthKey,
    servingDays: meta ? servingDays(monthKey).length : 0,
    students,
    groups,
    byMeal,
    mealsCooked,
    orderedDays: rows.length,
    parentTotal,
    vendorTotal,
    margin: parentTotal - vendorTotal,
    unknownCostDays,
  };
}

/// Chef's Choice vs picked dishes, which is what the kitchen plans around.
export function chefSplit(monthKey) {
  let chef = 0, chosen = 0;
  for (const day of servingDays(monthKey)) {
    for (const o of getOrdersForDate(monthKey, day)) {
      for (const slot of ['breakfast', 'lunch', 'brunch']) {
        if (!o[slot]) continue;
        if (o[slot] === CHEF_LABEL) chef++; else chosen++;
      }
    }
  }
  return { chef, chosen };
}
