// School calendar for September 2026
// Defines which dates are available per class group.
//
// Blocked dates come from the ZERA Meal Plan September 2026 Google Form, which
// annotates each week with the closures that apply to it:
//   Sep 16      — PH: Malaysia Day (everyone)
//   Sep 4       — Parents Conference, Homeschool & PLUS ("order cancelled by default")
//   Sep 7–11    — PLUS School Holidays
//   Sep 14–18   — Homeschool Holidays

// Groups a parent can pick for a child. "Cambridge PLUS" is a division inside
// Cambridge, not a group of its own — it follows the Cambridge calendar, so it
// is recorded on the student (year/division), never here.
export const CLASS_GROUPS = {
  Cambridge:  'Cambridge',
  Homeschool: 'Homeschool',
  Plus:       'Plus',
};

// Every group that has a calendar. Staff order meals but are not a class a
// parent can choose, so they are excluded from CLASS_GROUPS and included here —
// this is what the admin holiday view and the seed script iterate.
export const CALENDAR_GROUPS = {
  ...CLASS_GROUPS,
  Staff: 'Staff',
};

// Classes within Cambridge, matching the order form's dropdown. These are a
// division of Cambridge, not groups of their own: every one of them follows the
// Cambridge calendar, so they never appear in BLOCKED_DATES. Homeschool and
// Plus have no such split — they are picked as the group itself.
export const CLASS_DIVISIONS = {
  Cambridge: [
    'Cambridge Plus',
    'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
    'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11',
  ],
};

/// True when this group needs a class picked before the order can be completed.
export function requiresDivision(classGroup) {
  return Array.isArray(CLASS_DIVISIONS[classGroup]) && CLASS_DIVISIONS[classGroup].length > 0;
}

// ── Per-date holiday names ────────────────────────────────────────────────────

// Malaysian public holidays landing on a September 2026 weekday. Every group is
// blocked on these; student groups layer their own term dates on top.
const PUBLIC_HOLIDAYS = {
  16: { name: 'Malaysia Day', short: 'Malaysia', type: 'holiday' },
};

// Cambridge runs the full month apart from the public holiday.
const CAMBRIDGE_HOLIDAYS = { ...PUBLIC_HOLIDAYS };

// Staff work through the school term breaks — departments keep their own
// working days — so the only dates they cannot order are public holidays.
const STAFF_HOLIDAYS = { ...PUBLIC_HOLIDAYS };

// Homeschool: Parents Conference on the 4th, then their own break Sep 14–19.
const HOMESCHOOL_HOLIDAYS = {
  4:  { name: 'Parents Conference',  short: 'Conf',     type: 'break'   },
  14: { name: 'Homeschool Holidays', short: 'Break',    type: 'break'   },
  15: { name: 'Homeschool Holidays', short: 'Break',    type: 'break'   },
  ...PUBLIC_HOLIDAYS,
  17: { name: 'Homeschool Holidays', short: 'Break',    type: 'break'   },
  18: { name: 'Homeschool Holidays', short: 'Break',    type: 'break'   },
};

// PLUS: Parents Conference on the 4th, then their own break Sep 7–11.
const PLUS_HOLIDAYS = {
  4:  { name: 'Parents Conference',   short: 'Conf',  type: 'break'   },
  7:  { name: 'PLUS School Holidays', short: 'Break', type: 'break'   },
  8:  { name: 'PLUS School Holidays', short: 'Break', type: 'break'   },
  9:  { name: 'PLUS School Holidays', short: 'Break', type: 'break'   },
  10: { name: 'PLUS School Holidays', short: 'Break', type: 'break'   },
  11: { name: 'PLUS School Holidays', short: 'Break', type: 'break'   },
  ...PUBLIC_HOLIDAYS,
};

const HOLIDAY_MAP = {
  Cambridge:  CAMBRIDGE_HOLIDAYS,
  Homeschool: HOMESCHOOL_HOLIDAYS,
  Plus:       PLUS_HOLIDAYS,
  Staff:      STAFF_HOLIDAYS,
};

// ── Blocked date sets ─────────────────────────────────────────────────────────

export const BLOCKED_DATES = {
  Cambridge:  new Set(Object.keys(CAMBRIDGE_HOLIDAYS).map(Number)),
  Homeschool: new Set(Object.keys(HOMESCHOOL_HOLIDAYS).map(Number)),
  Plus:       new Set(Object.keys(PLUS_HOLIDAYS).map(Number)),
  Staff:      new Set(Object.keys(STAFF_HOLIDAYS).map(Number)),
};

// ── Public API ────────────────────────────────────────────────────────────────

export function getHolidayInfo(classGroup, date) {
  return HOLIDAY_MAP[classGroup]?.[date] || null;
}

export function blockedReason(classGroup, date) {
  return getHolidayInfo(classGroup, date)?.name || null;
}

export function isDateAvailable(classGroup, date) {
  const dow = new Date(2026, 8, date).getDay();
  if (dow === 0 || dow === 6) return false;
  // Fail closed. An unknown group used to fall through `?.` as "nothing is
  // blocked", quietly offering every weekday including public holidays.
  const blocked = BLOCKED_DATES[classGroup];
  if (!blocked) return false;
  return !blocked.has(date);
}

export function getAvailableDays(classGroup) {
  const days = [];
  for (let d = 1; d <= 30; d++) {
    if (isDateAvailable(classGroup, d)) days.push(d);
  }
  return days;
}

export function getBlockedDaysList(classGroup) {
  const blocked = BLOCKED_DATES[classGroup] || new Set();
  return [...blocked]
    .sort((a, b) => a - b)
    .map(d => ({ date: d, ...getHolidayInfo(classGroup, d) }));
}

export const TERM_BREAK_NOTICE = {
  Cambridge:  null,
  Homeschool: 'Homeschool Holidays: Sep 14–18, plus Parents Conference on Sep 4.',
  Plus:       'PLUS School Holidays: Sep 7–11, plus Parents Conference on Sep 4.',
  Staff:      null,
};
