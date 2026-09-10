// The database-backed half of the order store.
//
// Same names and same row shape as the localStorage functions in
// orderStore.js, but async — a network call cannot be made synchronous. Every
// caller therefore awaits, which is the one unavoidable change to the pages.
//
// Kept in its own file so the two implementations can be compared, and so a
// page can be moved across one at a time instead of in a single cut-over.

const json = async (url) => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
};

/// All orders served on one date.
export async function fetchOrdersForDate(monthKey, day) {
  const { rows } = await json(`/api/orders?month=${monthKey}&day=${day}`);
  return rows;
}

/// Order count per day, for the calendar dots.
export async function fetchOrderCounts(monthKey) {
  const { counts } = await json(`/api/orders?month=${monthKey}&counts=1`);
  return counts;
}

/// Every order-day in a month — what the bill is computed from.
export async function fetchMonthRows(monthKey) {
  const { rows } = await json(`/api/orders?month=${monthKey}&all=1`);
  return rows;
}

/// One student's days in a month, oldest first.
export async function fetchStudentDays(studentName, monthKey) {
  const { rows } = await json(
    `/api/orders?month=${monthKey}&student=${encodeURIComponent(studentName)}`
  );
  return rows;
}
