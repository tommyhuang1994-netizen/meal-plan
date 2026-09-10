// Server-side order queries. This is the real data layer; lib/orderStore.js is
// the client-facing seam that calls it through /api/orders.
//
// SERVER ONLY — it imports Prisma. A client component that imports this will
// fail to build, which is the intended guard rail: the anon path to this data
// stays closed until Auth and RLS exist, because these rows carry children's
// medical information.
//
// Every function returns the same row shape the UI already consumes:
//   { id, date, name, dept, year, allergies, note, breakfast, lunch, brunch,
//     price, source }
// so porting a page is a matter of awaiting the call, not reshaping its data.
import 'server-only';
import { prisma } from './db.js';

const CHEF_CHOICE = "Chef's Choice";

const GROUP_TO_DEPT = {
  CAMBRIDGE: 'Cambridge',
  HOMESCHOOL: 'Homeschool',
  PLUS: 'Plus',
  STAFF: 'Staff',
};
const SOURCE_TO_TAG = {
  PARENT_PORTAL: 'parent',
  SERVICE_SHEET: 'real',
  IMPORTED_FORM: 'real',
  SAMPLE: 'sample',
};

/// "2026-09" -> { year, month } with month 1-based, as OrderCycle stores it.
function cycleKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return { year, month };
}

const isoOf = (date) => date.toISOString().slice(0, 10);

/// Turn one OrderDay row into the flat shape the vendor and billing views use.
function toRow(day) {
  const order = day.order;
  const row = {
    id: day.id,
    date: isoOf(day.date),
    name: order.student.name,
    dept: GROUP_TO_DEPT[order.classGroup] ?? order.classGroup,
    year: order.student.year,
    allergies: order.allergies?.length ? order.allergies : order.student.allergies ?? [],
    note: order.allergyNote || order.student.allergyNote || '',
    breakfast: null,
    lunch: null,
    brunch: null,
    price: Number(day.price),
    // Day-level provenance, so one real date does not colour the rest.
    source: SOURCE_TO_TAG[day.source] ?? SOURCE_TO_TAG[order.source] ?? 'sample',
  };
  for (const meal of day.meals) {
    const slot = meal.mealType.toLowerCase();
    row[slot] = meal.mode === 'CHEF' ? CHEF_CHOICE : meal.itemNameSnapshot;
  }
  return row;
}

const DAY_INCLUDE = {
  meals: true,
  order: { include: { student: true } },
};

/// All orders served on one date.
export async function ordersForDate(monthKey, day) {
  const { year, month } = cycleKey(monthKey);
  const date = new Date(Date.UTC(year, month - 1, day));
  const rows = await prisma.orderDay.findMany({
    where: { date, order: { status: { not: 'CANCELLED' } } },
    include: DAY_INCLUDE,
  });
  return rows.map(toRow).sort((a, b) => a.name.localeCompare(b.name));
}

/// How many orders sit on each day of the month — for the calendar dots.
export async function orderCounts(monthKey) {
  const { year, month } = cycleKey(monthKey);
  const rows = await prisma.orderDay.groupBy({
    by: ['date'],
    where: {
      order: { cycle: { year, month }, status: { not: 'CANCELLED' } },
    },
    _count: true,
  });
  const counts = {};
  for (const r of rows) counts[new Date(r.date).getUTCDate()] = r._count;
  return counts;
}

/// Every order-day in a month, for the bill.
export async function daysInMonth(monthKey) {
  const { year, month } = cycleKey(monthKey);
  const rows = await prisma.orderDay.findMany({
    where: { order: { cycle: { year, month }, status: { not: 'CANCELLED' } } },
    include: DAY_INCLUDE,
  });
  return rows.map(toRow);
}

/// One student's days in a month, oldest first.
export async function studentDays(studentName, monthKey) {
  const { year, month } = cycleKey(monthKey);
  const rows = await prisma.orderDay.findMany({
    where: {
      order: {
        cycle: { year, month },
        student: { name: studentName },
        status: { not: 'CANCELLED' },
      },
    },
    include: DAY_INCLUDE,
    orderBy: { date: 'asc' },
  });
  return rows.map(toRow);
}

/// One summary card per student per month — what /parent lists.
export async function studentOrders(studentNames) {
  const orders = await prisma.order.findMany({
    where: {
      student: { name: { in: studentNames } },
      status: { not: 'CANCELLED' },
    },
    include: {
      student: true,
      cycle: true,
      plan: true,
      days: { include: { meals: true }, orderBy: { date: 'asc' } },
    },
  });

  return orders
    .map(o => ({
      id: `${o.cycle.year}-${String(o.cycle.month).padStart(2, '0')}-${o.student.name}`,
      monthKey: `${o.cycle.year}-${String(o.cycle.month).padStart(2, '0')}`,
      studentName: o.student.name,
      classGroup: GROUP_TO_DEPT[o.classGroup] ?? o.classGroup,
      division: o.student.year,
      allergies: o.allergies?.length ? o.allergies : o.student.allergies ?? [],
      allergyNote: o.allergyNote || o.student.allergyNote || '',
      planLabel: o.plan?.label ?? null,
      planCode: o.plan?.code ?? 'custom',
      dayCount: o.days.length,
      total: o.days.reduce((s, d) => s + Number(d.price), 0),
      chefDays: o.days.filter(d => d.meals.some(m => m.mode === 'CHEF')).length,
      fromPortal: o.source === 'PARENT_PORTAL',
      submittedAt: o.submittedAt?.toISOString() ?? null,
    }))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey) || a.studentName.localeCompare(b.studentName));
}

/// Everything needed to re-open a placed order in the order form.
export async function orderForEdit(studentName, monthKey) {
  const { year, month } = cycleKey(monthKey);
  const order = await prisma.order.findFirst({
    where: { cycle: { year, month }, student: { name: studentName }, status: { not: 'CANCELLED' } },
    include: {
      student: true,
      plan: true,
      days: { include: { meals: { include: { menuItem: true } } } },
    },
  });
  if (!order) return null;

  // Rebuild the per-date selection map the calendar renders from.
  const dateSelections = {};
  for (const day of order.days) {
    const sel = {};
    const chef = { breakfast: false, lunch: false };
    for (const meal of day.meals) {
      const slot = meal.mealType.toLowerCase();
      if (meal.mode === 'CHEF') {
        sel[slot] = { mode: 'chef' };
        if (slot in chef) chef[slot] = true;
      } else {
        sel[slot] = { mode: 'custom', id: meal.menuItem?.id ?? null };
      }
    }
    // chefBoth is what the pricing code keys the RM 18 bundle off.
    if (chef.breakfast && chef.lunch) sel.chefBoth = true;
    dateSelections[isoOf(day.date)] = sel;
  }

  return {
    classGroup: GROUP_TO_DEPT[order.classGroup] ?? order.classGroup,
    division: order.student.year,
    planCode: order.plan?.code ?? 'custom',
    allergies: order.allergies ?? [],
    allergyNote: order.allergyNote ?? '',
    dateSelections,
  };
}
