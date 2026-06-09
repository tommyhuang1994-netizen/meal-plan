// School calendar for June 2026
// Defines which dates are available per class group

export const CLASS_GROUPS = {
  Cambridge:  'Cambridge',
  Homeschool: 'Homeschool',
  Plus:       'Plus',
};

// ── Per-date holiday names ────────────────────────────────────────────────────

// Cambridge public holidays in June 2026
const CAMBRIDGE_HOLIDAYS = {
  1:  { name: 'Wesak Day',          short: 'Wesak',    type: 'holiday' },
  2:  { name: "Agong's Birthday",   short: 'Agong',    type: 'holiday' },
  17: { name: 'Awal Muharram',      short: 'Muharram', type: 'holiday' },
};

// Homeschool & Plus: term break Jun 1–19 + public holidays within it
const HP_HOLIDAYS = {
  1:  { name: 'Wesak Day (Term Break)',        short: 'Break', type: 'break'   },
  2:  { name: "Agong's Birthday (Term Break)", short: 'Break', type: 'break'   },
  3:  { name: 'Term Break',                    short: 'Break', type: 'break'   },
  4:  { name: 'Term Break',                    short: 'Break', type: 'break'   },
  5:  { name: 'Term Break',                    short: 'Break', type: 'break'   },
  8:  { name: 'Term Break',                    short: 'Break', type: 'break'   },
  9:  { name: 'Term Break',                    short: 'Break', type: 'break'   },
  10: { name: 'Term Break',                    short: 'Break', type: 'break'   },
  11: { name: 'Term Break',                    short: 'Break', type: 'break'   },
  12: { name: 'Term Break',                    short: 'Break', type: 'break'   },
  15: { name: 'Term Break',                    short: 'Break', type: 'break'   },
  16: { name: 'Awal Muharram (Term Break)',    short: 'Break', type: 'break'   },
  17: { name: 'Term Break',                    short: 'Break', type: 'break'   },
  18: { name: 'Term Break',                    short: 'Break', type: 'break'   },
  19: { name: 'Term Break',                    short: 'Break', type: 'break'   },
};

const HOLIDAY_MAP = {
  Cambridge:  CAMBRIDGE_HOLIDAYS,
  Homeschool: HP_HOLIDAYS,
  Plus:       HP_HOLIDAYS,
};

// ── Blocked date sets ─────────────────────────────────────────────────────────

export const BLOCKED_DATES = {
  Cambridge:  new Set(Object.keys(CAMBRIDGE_HOLIDAYS).map(Number)),
  Homeschool: new Set(Object.keys(HP_HOLIDAYS).map(Number)),
  Plus:       new Set(Object.keys(HP_HOLIDAYS).map(Number)),
};

// ── Public API ────────────────────────────────────────────────────────────────

export function getHolidayInfo(classGroup, date) {
  return HOLIDAY_MAP[classGroup]?.[date] || null;
}

export function blockedReason(classGroup, date) {
  return getHolidayInfo(classGroup, date)?.name || null;
}

export function isDateAvailable(classGroup, date) {
  const dow = new Date(2026, 5, date).getDay();
  if (dow === 0 || dow === 6) return false;
  return !BLOCKED_DATES[classGroup]?.has(date);
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
  Homeschool: 'Term Break: Jun 1–19. Orders available from Jun 22 onwards.',
  Plus:       'Term Break: Jun 1–19. Orders available from Jun 22 onwards.',
};
