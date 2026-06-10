// Pricing data: vendor cost vs parent price for all items
// vendorCost = what the school pays the vendor
// parentPrice = what parents are charged (includes markup)

// ── Chef's Choice plans ───────────────────────────────────────────────────────

export const CHEFS_PRICING = [
  { id: 'chefs_both',    label: "Chef's Choice",     note: 'Breakfast & Lunch + Friday Brunch', vendorCost: 8.00,  parentPrice: 10.00 },
  { id: 'chefs_bf',      label: "Chef's Choice",     note: 'Breakfast only',                    vendorCost: 3.00,  parentPrice: 4.00  },
  { id: 'chefs_ln',      label: "Chef's Choice",     note: 'Lunch only',                        vendorCost: 4.50,  parentPrice: 6.00  },
  { id: 'chefs_brunch',  label: "Chef's Choice",     note: 'Friday Brunch',                     vendorCost: 6.00,  parentPrice: 8.00  },
  // Meal Set promo: both meals, Chef's Choice, charged PER STUDY DAY at a promo
  // rate. The whole-month total = (available study days for that class group) ×
  // this rate, so Cambridge and Homeschool/Plus differ by their day counts.
  // TODO: set the real promotional per-day rate here (placeholder values below).
  { id: 'chefs_set_daily', label: "Chef's Choice Meal Set", note: 'Both meals · Chef\'s Choice · per study day (promo rate)', vendorCost: 6.50, parentPrice: 8.00 },
];

// Per-study-day promo rate for the "Chef's Choice Meal Set" (read by the parent
// order page). Multiply by the class group's available days for the month total.
export const MEAL_SET_DAILY_PRICE = CHEFS_PRICING.find(p => p.id === 'chefs_set_daily')?.parentPrice ?? 0;

// ── À la carte menu items ─────────────────────────────────────────────────────
// Vendor cost is typically 70-80% of parent price

export const MENU_PRICING = {
  // Breakfast items
  'Nasi Lemak':         { type: 'Breakfast', vendorCost: 2.50, parentPrice: 3.50 },
  'Roti Canai':         { type: 'Breakfast', vendorCost: 2.00, parentPrice: 3.00 },
  'Nasi Goreng':        { type: 'Breakfast', vendorCost: 3.00, parentPrice: 4.00 },
  'Sandwich Set':       { type: 'Breakfast', vendorCost: 3.20, parentPrice: 4.50 },
  'Mihun Soup':         { type: 'Breakfast', vendorCost: 2.50, parentPrice: 3.50 },
  'Bread & Butter':     { type: 'Breakfast', vendorCost: 2.00, parentPrice: 3.00 },
  'Chapati Set':        { type: 'Breakfast', vendorCost: 2.80, parentPrice: 4.00 },
  'Mee Soup':           { type: 'Breakfast', vendorCost: 2.50, parentPrice: 3.50 },
  'Roti Telur':         { type: 'Breakfast', vendorCost: 2.80, parentPrice: 4.00 },
  'Oat Porridge':       { type: 'Breakfast', vendorCost: 2.50, parentPrice: 3.50 },
  // Lunch items
  'Chicken Rice':       { type: 'Lunch',     vendorCost: 4.00, parentPrice: 5.50 },
  'Mee Goreng':         { type: 'Lunch',     vendorCost: 3.50, parentPrice: 5.00 },
  'Economy Rice':       { type: 'Lunch',     vendorCost: 3.80, parentPrice: 5.50 },
  'Pasta Bolognese':    { type: 'Lunch',     vendorCost: 4.50, parentPrice: 6.00 },
  'Nasi Campur':        { type: 'Lunch',     vendorCost: 5.00, parentPrice: 6.50 },
  'Chicken Chop':       { type: 'Lunch',     vendorCost: 5.50, parentPrice: 7.00 },
  'Fried Rice Set':     { type: 'Lunch',     vendorCost: 4.00, parentPrice: 5.50 },
  'Nasi Ayam Penyet':   { type: 'Lunch',     vendorCost: 5.00, parentPrice: 6.50 },
  'Mee Mamak':          { type: 'Lunch',     vendorCost: 4.00, parentPrice: 5.50 },
  'Steam Ginger Chicken':{ type: 'Lunch',    vendorCost: 5.50, parentPrice: 7.00 },
  'Nasi Goreng USA':    { type: 'Lunch',     vendorCost: 4.50, parentPrice: 6.00 },
  'Fish & Chips':       { type: 'Lunch',     vendorCost: 5.50, parentPrice: 7.00 },
  // Brunch items
  'Big Breakfast Plate':{ type: 'Brunch',    vendorCost: 6.00, parentPrice: 7.50 },
  'Nasi Lemak Special': { type: 'Brunch',    vendorCost: 5.50, parentPrice: 7.00 },
  'Pancake Stack':      { type: 'Brunch',    vendorCost: 5.00, parentPrice: 6.50 },
  'Waffles & Fruit':    { type: 'Brunch',    vendorCost: 5.50, parentPrice: 7.00 },
};
