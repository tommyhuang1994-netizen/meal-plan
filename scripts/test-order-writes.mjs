// End-to-end check of the write path against the live database.
// Places an order for a real student, verifies it shows up on the vendor's
// view of that date, changes one day, tries a locked day, then cancels.
//
// Uses a Staff member so no child's record is disturbed.
const BASE = 'http://localhost:3000/api/orders';
const STUDENT = 'Shiryn Goh';
const MONTH = '2026-09';

const j = async (url, opts) => {
  const r = await fetch(url, opts);
  const body = await r.json();
  return { status: r.status, body };
};

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) failures++;
};

// 22 and 23 September are open; 3 September is long past its cut-off.
const OPEN_A = '2026-09-22', OPEN_B = '2026-09-23', LOCKED = '2026-09-03';

console.log('1. place an order');
const placed = await j(BASE, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    studentName: STUDENT, monthKey: MONTH, dept: 'Staff',
    allergies: [], allergyNote: '', planCode: 'chefs_both',
    days: [
      { date: OPEN_A, breakfast: "Chef's Choice", lunch: "Chef's Choice", price: 18 },
      { date: OPEN_B, breakfast: "Chef's Choice", lunch: "Chef's Choice", price: 18 },
      { date: LOCKED, breakfast: "Chef's Choice", lunch: "Chef's Choice", price: 18 },
    ],
  }),
});
check('POST returns 200', placed.status === 200, JSON.stringify(placed.body).slice(0, 90));
check('locked day rejected on save', placed.body.rejected === 1, `rejected=${placed.body.rejected}`);

console.log('\n2. the vendor sees it on that date');
const vendor = await j(`${BASE}?month=${MONTH}&day=22`);
const mine = vendor.body.rows?.find(r => r.name === STUDENT);
check('appears in the vendor view', !!mine);
check('tagged as a portal order', mine?.source === 'parent', `source=${mine?.source}`);
check('priced at the RM 18 bundle', mine?.price === 18, `price=${mine?.price}`);

console.log('\n3. change one day');
const patched = await j(BASE, {
  method: 'PATCH',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    studentName: STUDENT, monthKey: MONTH, date: OPEN_A,
    breakfast: 'Nasi Lemak', lunch: null, brunch: null, price: 7,
  }),
});
check('PATCH returns 200', patched.status === 200);
const after = await j(`${BASE}?month=${MONTH}&day=22`);
const changed = after.body.rows?.find(r => r.name === STUDENT);
check('meal changed', changed?.breakfast === 'Nasi Lemak', `bf=${changed?.breakfast}`);
check('lunch cleared', changed?.lunch === null, `ln=${changed?.lunch}`);
check('reprice applied', changed?.price === 7, `price=${changed?.price}`);

console.log('\n4. a locked day refuses to change');
const locked = await j(BASE, {
  method: 'PATCH',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    studentName: STUDENT, monthKey: MONTH, date: LOCKED,
    breakfast: 'Nasi Lemak', lunch: null, brunch: null, price: 7,
  }),
});
check('PATCH on a locked day returns 409', locked.status === 409, `status=${locked.status}`);
check('reason is "locked"', locked.body.reason === 'locked', `reason=${locked.body.reason}`);

console.log('\n5. summary reflects the order');
const summary = await j(`${BASE}?month=${MONTH}&summary=1&students=${encodeURIComponent(STUDENT)}`);
const card = summary.body.orders?.find(o => o.monthKey === MONTH);
check('summary card exists', !!card, `days=${card?.dayCount} total=${card?.total}`);

// The order keeps days already past their cut-off, so the total is NOT just
// the two days placed here. The invariant worth asserting is that the summary
// always equals the sum of its own day list — a receipt that disagrees with
// its line items is the bug that actually costs a parent money.
const detail = await j(`${BASE}?month=${MONTH}&student=${encodeURIComponent(STUDENT)}`);
const sum = detail.body.rows.reduce((s, r) => s + r.price, 0);
check('total equals the sum of its days', card?.total === sum, `card=${card?.total} days=${sum}`);
check('day count matches', card?.dayCount === detail.body.rows.length,
  `card=${card?.dayCount} rows=${detail.body.rows.length}`);
const survivors = detail.body.rows.filter(r => r.date < OPEN_A && r.date !== LOCKED).length;
check('locked days survived the re-order', survivors > 0, `${survivors} kept`);

console.log('\n6. cancel');
const cancelled = await j(`${BASE}?student=${encodeURIComponent(STUDENT)}&month=${MONTH}&reason=test`, { method: 'DELETE' });
check('DELETE returns ok', cancelled.body.ok === true);
const gone = await j(`${BASE}?month=${MONTH}&day=22`);
check('no longer in the vendor view', !gone.body.rows?.some(r => r.name === STUDENT));

console.log(`\n${failures === 0 ? 'all checks passed' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
