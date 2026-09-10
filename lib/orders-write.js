// Server-side order writes. Reads live in orders-db.js.
//
// SERVER ONLY. Placing an order touches three tables — Order, OrderDay,
// OrderMeal — so every write runs in a transaction: a half-written order would
// show the kitchen meals the parent is not being charged for, or charge for
// meals the kitchen never sees.
import 'server-only';
import { prisma } from './db.js';
import { isDateLocked } from './cutoff.js';
import { MENU_PRICING } from './pricingData.js';
import { cycleKey, isoOf, CHEF_CHOICE } from './orders-db.js';

const DEPT_TO_GROUP = {
  Cambridge: 'CAMBRIDGE',
  Homeschool: 'HOMESCHOOL',
  Plus: 'PLUS',
  Staff: 'STAFF',
};
const SLOT_TYPE = { breakfast: 'BREAKFAST', lunch: 'LUNCH', brunch: 'BRUNCH' };
const utcDate = (iso) => new Date(`${iso}T00:00:00.000Z`);

/// Meal rows for one day, resolving dish names to catalogue ids and snapshotting
/// both prices — so repricing a dish later never rewrites an order already placed.
function mealRowsFor(row, orderDayId, itemByName) {
  const rows = [];
  for (const slot of ['breakfast', 'lunch', 'brunch']) {
    const value = row[slot];
    if (!value) continue;
    const isChef = value === CHEF_CHOICE;
    const price = MENU_PRICING[value];
    rows.push({
      orderDayId,
      mealType: SLOT_TYPE[slot],
      mode: isChef ? 'CHEF' : 'CUSTOM',
      menuItemId: isChef ? null : itemByName.get(value) ?? null,
      itemNameSnapshot: isChef ? null : value,
      unitParentPrice: isChef ? 0 : price?.parentPrice ?? 0,
      unitVendorCost: isChef ? 0 : price?.vendorCost ?? 0,
    });
  }
  return rows;
}

async function catalogue() {
  const items = await prisma.menuItem.findMany({ select: { id: true, name: true } });
  return new Map(items.map(i => [i.name, i.id]));
}

/// Place or replace a parent's order for one student and month.
///
/// Days already past their cut-off are left exactly as they are. The kitchen is
/// committed to those meals, so a re-order must not silently drop or reprice
/// one that is already being cooked — and the parent is still charged for it.
export async function saveOrder({
  studentName, monthKey, dept, allergies = [], allergyNote = '',
  planCode = 'custom', days = [],
}) {
  const { year: cy, month: cm } = cycleKey(monthKey);

  const student = await prisma.student.findFirst({ where: { name: studentName } });
  if (!student) throw new Error(`no student named ${studentName}`);

  const cycle = await prisma.orderCycle.upsert({
    where: { year_month: { year: cy, month: cm } },
    update: {},
    create: { year: cy, month: cm, status: 'OPEN' },
  });

  const plan = planCode && planCode !== 'custom'
    ? await prisma.planOption.findUnique({ where: { code: planCode } })
    : null;

  const itemByName = await catalogue();
  const incoming = days.filter(d => !isDateLocked(d.date));
  const rejected = days.length - incoming.length;

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.upsert({
      where: { cycleId_studentId: { cycleId: cycle.id, studentId: student.id } },
      update: {
        status: 'SUBMITTED',
        source: 'PARENT_PORTAL',
        planId: plan?.id ?? null,
        classGroup: DEPT_TO_GROUP[dept] ?? student.classGroup,
        allergies,
        allergyNote: allergyNote || null,
        submittedAt: new Date(),
        cancelledAt: null,
        cancelledById: null,
      },
      create: {
        cycleId: cycle.id,
        studentId: student.id,
        classGroup: DEPT_TO_GROUP[dept] ?? student.classGroup,
        status: 'SUBMITTED',
        source: 'PARENT_PORTAL',
        planId: plan?.id ?? null,
        allergies,
        allergyNote: allergyNote || null,
        submittedAt: new Date(),
      },
    });

    // Remove only the days still open to change; locked ones survive untouched.
    const existing = await tx.orderDay.findMany({
      where: { orderId: order.id },
      select: { id: true, date: true },
    });
    const removable = existing.filter(d => !isDateLocked(isoOf(d.date))).map(d => d.id);
    if (removable.length) await tx.orderDay.deleteMany({ where: { id: { in: removable } } });

    for (const d of incoming) {
      const day = await tx.orderDay.create({
        data: {
          orderId: order.id,
          date: utcDate(d.date),
          price: d.price ?? 0,
          source: 'PARENT_PORTAL',
        },
      });
      const meals = mealRowsFor(d, day.id, itemByName);
      if (meals.length) await tx.orderMeal.createMany({ data: meals });
    }

    // Total is summed from the rows that actually survived, locked ones
    // included, so an order can never disagree with its own day list.
    const kept = await tx.orderDay.findMany({
      where: { orderId: order.id },
      select: { price: true },
    });
    const total = kept.reduce((s, d) => s + Number(d.price), 0);
    await tx.order.update({ where: { id: order.id }, data: { subtotal: total, total } });

    return { orderId: order.id, dayCount: kept.length, total, rejected };
  });
}

/// Replace one day of a placed order. Refuses a date past its cut-off.
export async function updateOrderDay({ studentName, monthKey, date, breakfast, lunch, brunch, price }) {
  if (isDateLocked(date)) return { ok: false, reason: 'locked' };

  const { year, month } = cycleKey(monthKey);
  const order = await prisma.order.findFirst({
    where: { cycle: { year, month }, student: { name: studentName }, status: { not: 'CANCELLED' } },
  });
  if (!order) return { ok: false, reason: 'not-found' };

  const day = await prisma.orderDay.findFirst({
    where: { orderId: order.id, date: utcDate(date) },
    include: { meals: true },
  });
  if (!day) return { ok: false, reason: 'not-found' };

  const itemByName = await catalogue();
  const nameOf = (type) => {
    const m = day.meals.find(x => x.mealType === type);
    if (!m) return null;
    return m.mode === 'CHEF' ? CHEF_CHOICE : m.itemNameSnapshot;
  };
  const before = {
    breakfast: nameOf('BREAKFAST'),
    lunch: nameOf('LUNCH'),
    brunch: nameOf('BRUNCH'),
    price: Number(day.price),
  };

  await prisma.$transaction(async (tx) => {
    await tx.orderMeal.deleteMany({ where: { orderDayId: day.id } });
    const meals = mealRowsFor({ breakfast, lunch, brunch }, day.id, itemByName);
    if (meals.length) await tx.orderMeal.createMany({ data: meals });
    await tx.orderDay.update({
      where: { id: day.id },
      data: { price: price ?? 0, source: 'PARENT_PORTAL' },
    });

    // This is what the audit table is for: OrderDay only ever shows its final
    // state, so a change is recorded as it happens or not at all.
    await tx.orderDayChange.create({
      data: {
        orderDayId: day.id,
        actorRole: 'PARENT',
        before,
        after: {
          breakfast: breakfast ?? null,
          lunch: lunch ?? null,
          brunch: brunch ?? null,
          price: price ?? 0,
        },
      },
    });

    const kept = await tx.orderDay.findMany({ where: { orderId: order.id }, select: { price: true } });
    const total = kept.reduce((s, x) => s + Number(x.price), 0);
    await tx.order.update({ where: { id: order.id }, data: { subtotal: total, total } });
  });

  return { ok: true };
}

/// Cancel one student's order for a month, at the parent's request.
///
/// Marked CANCELLED rather than deleted: "who cancelled this, and when" is the
/// question that gets asked once money is involved, and a deleted row cannot
/// answer it. Reads already filter cancelled orders out.
export async function cancelOrder(studentName, monthKey, { cancelledById = null, reason = null } = {}) {
  const { year, month } = cycleKey(monthKey);
  const order = await prisma.order.findFirst({
    where: { cycle: { year, month }, student: { name: studentName }, status: { not: 'CANCELLED' } },
    include: { days: true },
  });
  if (!order) return { ok: false, removed: 0 };

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledById, cancelReason: reason },
  });
  return { ok: true, removed: order.days.length };
}
