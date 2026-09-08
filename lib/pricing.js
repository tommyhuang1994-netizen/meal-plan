// How a day's meals are priced.
//
// Both the order page and the per-day edit sheet on /parent read from here, so
// a meal costs the same wherever it is changed. Rates come from
// lib/pricingData.js — this module never carries a price literal of its own.

import { MENU_BY_DATE, isFridayDate } from './menuData.js';
import { CHEFS_PRICING, MENU_PRICING } from './pricingData.js';

const plan      = (id) => CHEFS_PRICING.find(p => p.id === id);
const planPrice = (id) => plan(id)?.parentPrice ?? 0;
const planCost  = (id) => plan(id)?.vendorCost ?? null;

export const CHEFS_PRICE = {
  chefs_both: planPrice('chefs_both'),   // both meals, promo pair rate
  chefs_bf:   planPrice('chefs_bf'),
  chefs_ln:   planPrice('chefs_ln'),
};
export const CHEFS_BRUNCH = planPrice('chefs_brunch');

// The both-meals promotion is the only discount, and it is priced directly into
// chefs_both (RM 18.00 against RM 19.00 for the two meals bought singly). It is
// a Chef's Choice benefit only, so two à-la-carte picks carry no discount.
export const COMBO_DISCOUNT = 0;

export function fmt(n) { return `RM ${Number(n).toFixed(2)}`; }

/// A meal slot counts as ordered if it's Chef's Choice or a custom pick.
/// Each slot is { mode:'chef' } | { mode:'custom', id } | undefined.
export function mealPicked(m) {
  return !!m && (m.mode === 'chef' || (m.mode === 'custom' && !!m.id));
}

/// A date counts as ordered if Chef's-Both is on or any slot is picked.
export function isDatePicked(sel) {
  if (!sel) return false;
  return !!sel.chefBoth || mealPicked(sel.breakfast) || mealPicked(sel.lunch) || mealPicked(sel.brunch);
}

/// Price one meal slot: chef = flat chef rate, custom = the picked item's price.
export function mealCost(slot, chefRate, items) {
  if (!slot) return 0;
  if (slot.mode === 'chef') return chefRate;
  if (slot.mode === 'custom' && slot.id) return items?.find(x => x.id === slot.id)?.price ?? 0;
  return 0;
}

/// Price one ordered date. The single source for what a day costs.
export function priceForDate(iso, sel) {
  if (!isDatePicked(sel)) return { price: 0, discount: 0 };
  const dayM   = MENU_BY_DATE[iso];
  const dayNum = parseInt(iso.split('-')[2], 10);

  if (isFridayDate(dayNum)) {
    return { price: mealCost(sel.brunch, CHEFS_BRUNCH, dayM?.brunch), discount: 0 };
  }
  if (sel.chefBoth) {
    return { price: CHEFS_PRICE.chefs_both, discount: 0 };
  }
  const price = mealCost(sel.breakfast, CHEFS_PRICE.chefs_bf, dayM?.breakfast)
              + mealCost(sel.lunch,     CHEFS_PRICE.chefs_ln, dayM?.lunch);
  const discount = (sel.breakfast?.mode === 'custom' && sel.breakfast?.id &&
                    sel.lunch?.mode === 'custom'     && sel.lunch?.id) ? COMBO_DISCOUNT : 0;
  return { price, discount };
}

/// The dish names a slot resolves to, as the vendor sheet shows them.
export const CHEF_LABEL = "Chef's Choice";

export function dishNamesFor(iso, sel) {
  const menu = MENU_BY_DATE[iso];
  const nameOf = (slot, list) => {
    if (!slot) return null;
    if (slot.mode === 'chef') return CHEF_LABEL;
    return list?.find(x => x.id === slot.id)?.name ?? null;
  };
  return {
    breakfast: sel?.chefBoth ? CHEF_LABEL : nameOf(sel?.breakfast, menu?.breakfast),
    lunch:     sel?.chefBoth ? CHEF_LABEL : nameOf(sel?.lunch,     menu?.lunch),
    brunch:    nameOf(sel?.brunch, menu?.brunch),
  };
}


// ── What a served day is worth ───────────────────────────────────────────────
// Billing works off the meal NAMES on an order row, because that is the one
// shape both sample orders and parent-submitted orders share. Returns what the
// parent pays and what the school owes the vendor for that day.

const CHEF_PLAN = {
  breakfast: 'chefs_bf',
  lunch:     'chefs_ln',
  brunch:    'chefs_brunch',
};

/// Parent price and vendor cost for one day of one student's order.
/// `row` is { breakfast, lunch, brunch } of dish names, CHEF_LABEL, or null.
export function rowCharges(row) {
  const bothChef = row.breakfast === CHEF_LABEL && row.lunch === CHEF_LABEL;

  // The both-meals promotion is a single bundled charge, not two meals added up.
  if (bothChef) {
    return { parent: planPrice('chefs_both'), vendor: planCost('chefs_both') ?? 0, unknownCost: planCost('chefs_both') == null };
  }

  let parent = 0, vendor = 0, unknownCost = false;
  for (const slot of ['breakfast', 'lunch', 'brunch']) {
    const name = row[slot];
    if (!name) continue;
    if (name === CHEF_LABEL) {
      const id = CHEF_PLAN[slot];
      parent += planPrice(id);
      const c = planCost(id);
      if (c == null) unknownCost = true; else vendor += c;
    } else {
      const item = MENU_PRICING[name];
      parent += item?.parentPrice ?? 0;
      if (item?.vendorCost == null) unknownCost = true; else vendor += item.vendorCost;
    }
  }
  return { parent, vendor, unknownCost };
}

/// How many meals a row represents — what the kitchen actually cooks.
export function mealCount(row) {
  return ['breakfast', 'lunch', 'brunch'].filter(slot => !!row[slot]).length;
}
