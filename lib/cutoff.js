// When a parent can still change an order.
//
// Rule: the kitchen needs TWO CLEAR DAYS of notice, and the day's ordering
// closes at 22:00. So a meal date shuts at 10pm three calendar days earlier,
// which leaves two whole untouched days in between.
//
//   Standing on Tue 8 Sep:
//     Wed 9  — closed (its 10pm cut-off was Sun 6)
//     Thu 10 — closed (its 10pm cut-off was Mon 7)
//     Fri 11 — open until 10pm TONIGHT; the 9th and 10th are its two clear days
//
// The whole rule lives here. The parent order page, the receipt on /parent and
// anything else that needs to know read these functions, so the window can be
// changed in one edit.

export const CLEAR_DAYS_NOTICE = 2;   // untouched days between cut-off and meal
export const CUTOFF_HOUR = 22;        // 10pm, local time

// Kept for callers that just want to say "2 days" in a sentence.
export const CUTOFF_DAYS = CLEAR_DAYS_NOTICE;

/// The moment ordering closes for one meal date ("2026-09-11").
export function deadlineFor(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dl = new Date(y, m - 1, d);
  // +1 because the cut-off evening itself is not one of the clear days.
  dl.setDate(dl.getDate() - (CLEAR_DAYS_NOTICE + 1));
  dl.setHours(CUTOFF_HOUR, 0, 0, 0);
  return dl;
}

/// True once that date can no longer be changed by a parent.
export function isDateLocked(iso, now = new Date()) {
  return now.getTime() > deadlineFor(iso).getTime();
}

/// "8 Sep, 10:00 pm" — for telling the parent when a date closes.
export function formatDeadline(iso, lang = 'en') {
  const dl = deadlineFor(iso);
  const day = dl.getDate();
  const monthEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dl.getMonth()];
  const hour12 = ((dl.getHours() + 11) % 12) + 1;
  const ampm = dl.getHours() < 12 ? 'am' : 'pm';
  if (lang === 'zh') {
    return `${dl.getMonth() + 1}月${day}日 ${dl.getHours()}:00`;
  }
  return `${day} ${monthEn}, ${hour12}:00 ${ampm}`;
}

/// Split a list of day numbers into what is still open and what has closed.
export function splitByLock(dateKeys, now = new Date()) {
  const open = [], locked = [];
  for (const iso of dateKeys) (isDateLocked(iso, now) ? locked : open).push(iso);
  return { open, locked };
}
