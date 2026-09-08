// Pricing data: vendor cost vs parent price for all items
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
  { id: 'chefs_set_daily', label: "Chef's Choice Meal Set", note: 'Both meals · Chef\'s Choice · per study day (promo rate)', vendorCost: 16.50, parentPrice: 18.00 },
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
  // Breakfast items
  'Chee Cheong Fun':                                               { type: 'Breakfast',  vendorCost: 6.00,   parentPrice: 7.00 },
  'Chicken Ham and Cheese sandwich':                               { type: 'Breakfast',  vendorCost: 6.00,   parentPrice: 7.00 },
  'Chicken Porridge':                                              { type: 'Breakfast',  vendorCost: 6.00,   parentPrice: 7.00 },
  'Chinese Fried Rice':                                            { type: 'Breakfast',  vendorCost: 6.00,   parentPrice: 7.00 },
  'Chocolate chip cookies, Fruit and Yogurt':                      { type: 'Breakfast',  vendorCost: 6.00,   parentPrice: 7.00 },
  'Egg Burito':                                                    { type: 'Breakfast',  vendorCost: 6.00,   parentPrice: 7.00 },
  'Egg Sandwich':                                                  { type: 'Breakfast',  vendorCost: 6.00,   parentPrice: 7.00 },
  'Fried White Mee Hoon':                                          { type: 'Breakfast',  vendorCost: 6.00,   parentPrice: 7.00 },
  'Kaya Cheese Toast':                                             { type: 'Breakfast',  vendorCost: 6.00,   parentPrice: 7.00 },
  'Mee Goreng Mamak':                                              { type: 'Breakfast',  vendorCost: 6.00,   parentPrice: 7.00 },
  'Mee Siam':                                                      { type: 'Breakfast',  vendorCost: 6.00,   parentPrice: 7.00 },
  'Nasi Lemak':                                                    { type: 'Breakfast',  vendorCost: 6.00,   parentPrice: 7.00 },
  'Nissin Noodle':                                                 { type: 'Breakfast',  vendorCost: 6.00,   parentPrice: 7.00 },
  'Pancake':                                                       { type: 'Breakfast',  vendorCost: 6.00,   parentPrice: 7.00 },
  'Potato Burger':                                                 { type: 'Breakfast',  vendorCost: 6.00,   parentPrice: 7.00 },
  'Tuna Sandwich':                                                 { type: 'Breakfast',  vendorCost: 6.00,   parentPrice: 7.00 },
  // Lunch items
  'Butter Herb Rice':                                              { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Butter Herb Rice 🥬':                                           { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Chicken Curry':                                                 { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Chicken Kicap':                                                 { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Chicken Rendang':                                               { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Chicken Subway set':                                            { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Chicken Teriyaki Don':                                          { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Dry Minced Chicken Noodle served dumpling, Salad and fruits.':  { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Fish and Chips':                                                { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Fish Sweet Sour':                                               { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Herb Rice':                                                     { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Homemade Chicken Burger set':                                   { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Horfun Fun, Keow Teoh':                                         { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Mushroom Pasta':                                                { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Soya Sauce braised Tafoo 🥬':                                   { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Spaghetti':                                                     { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Spaghetti Aglio Olio':                                          { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Sweet Sour Chicken':                                            { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Sweet Sour Tafoo 🥬':                                           { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Thai Basil Chicken':                                            { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Thai Basil Tafoo 🥬':                                           { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Vegetarian Chicken Curry 🥬':                                   { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Vegetarian Chicken Rendang 🥬':                                 { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  'Vegetarian Chicken Teriyaki Don 🥬':                            { type: 'Lunch',      vendorCost: 11.00,  parentPrice: 12.00 },
  // Brunch items
  'Ayam Masak Kunyit':                                             { type: 'Brunch',     vendorCost: 11.00,  parentPrice: 12.00 },
  'Chicken Katsu Don':                                             { type: 'Brunch',     vendorCost: 11.00,  parentPrice: 12.00 },
  'Chicken Torilla Wrap':                                          { type: 'Brunch',     vendorCost: 11.00,  parentPrice: 12.00 },
  'Chik Kut The (chicken) Rice Set':                               { type: 'Brunch',     vendorCost: 11.00,  parentPrice: 12.00 },
  'Tafoo and Potato Masak Kunyit 🥬':                              { type: 'Brunch',     vendorCost: 11.00,  parentPrice: 12.00 },
  'Veggie Torilla Wrap 🥬':                                        { type: 'Brunch',     vendorCost: 11.00,  parentPrice: 12.00 },
};
