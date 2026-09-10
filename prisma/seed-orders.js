// Loads the orders the app currently holds in code into Postgres.
//
//   node prisma/seed-orders.js
//
// Two sources, and the difference between them is recorded rather than lost:
//   - lib/realOrders.js  — the school's vendor name lists  -> SERVICE_SHEET
//   - generated samples  — stand-in data for every other day -> SAMPLE
//
// Order.source keeps that distinction in the database, so a bill can later
// exclude SAMPLE rows instead of quietly charging someone for invented meals.
// Idempotent: re-running replaces each order's days rather than duplicating.
import { config } from 'dotenv';
config({ path: ['.env.local', '.env'], quiet: true });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { MONTHS, servingDays, getOrdersForDate, isoDate, CHEF_CHOICE } from '../lib/orderStore.js';
import { rowCharges } from '../lib/pricing.js';
import { MENU_PRICING } from '../lib/pricingData.js';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const GROUP = { Cambridge: 'CAMBRIDGE', Homeschool: 'HOMESCHOOL', Plus: 'PLUS', Staff: 'STAFF' };
const SLOT_TYPE = { breakfast: 'BREAKFAST', lunch: 'LUNCH', brunch: 'BRUNCH' };
const utcDate = (iso) => new Date(`${iso}T00:00:00.000Z`);

/// Which Chef's Choice plan a day's meals amount to. Null means the parent
/// picked dishes themselves — "I'll choose" has no PlanOption behind it.
function planCodeFor(rows) {
  let both = 0, bf = 0, ln = 0, br = 0;
  for (const r of rows) {
    const b = r.breakfast === CHEF_CHOICE;
    const l = r.lunch === CHEF_CHOICE;
    if (b && l) both++;
    else if (b) bf++;
    else if (l) ln++;
    if (r.brunch === CHEF_CHOICE) br++;
  }
  if (both) return 'chefs_both';
  if (bf) return 'chefs_bf';
  if (ln) return 'chefs_ln';
  if (br) return 'chefs_brunch';
  return null;
}

async function main() {
  const menuItems = await prisma.menuItem.findMany({ select: { id: true, name: true } });
  const itemByName = new Map(menuItems.map(m => [m.name, m.id]));
  const plans = await prisma.planOption.findMany({ select: { id: true, code: true } });
  const planByCode = new Map(plans.map(p => [p.code, p.id]));
  const students = await prisma.student.findMany({ select: { id: true, name: true } });
  const studentByName = new Map(students.map(s => [s.name, s.id]));

  let orders = 0, days = 0, meals = 0, skipped = 0;

  for (const m of MONTHS) {
    const cycle = await prisma.orderCycle.upsert({
      where: { year_month: { year: m.year, month: m.month + 1 } },
      update: {},
      create: { year: m.year, month: m.month + 1, status: 'OPEN' },
    });

    // Collect every row for the month, grouped by student.
    const byStudent = new Map();
    for (const day of servingDays(m.key)) {
      for (const r of getOrdersForDate(m.key, day)) {
        if (!byStudent.has(r.name)) byStudent.set(r.name, []);
        byStudent.get(r.name).push({ ...r, iso: isoDate(m.year, m.month, day) });
      }
    }

    for (const [name, rows] of byStudent) {
      const studentId = studentByName.get(name);
      if (!studentId) { skipped++; continue; }

      const anySheet = rows.some(r => r.source === 'real');
      const planCode = planCodeFor(rows);
      const total = rows.reduce((s, r) => s + rowCharges(r).parent, 0);

      const order = await prisma.order.upsert({
        where: { cycleId_studentId: { cycleId: cycle.id, studentId } },
        update: {
          status: 'SUBMITTED',
          source: anySheet ? 'SERVICE_SHEET' : 'SAMPLE',
          planId: planCode ? planByCode.get(planCode) ?? null : null,
          subtotal: total,
          total,
        },
        create: {
          cycleId: cycle.id,
          studentId,
          classGroup: GROUP[rows[0].dept] ?? 'CAMBRIDGE',
          status: 'SUBMITTED',
          source: anySheet ? 'SERVICE_SHEET' : 'SAMPLE',
          planId: planCode ? planByCode.get(planCode) ?? null : null,
          subtotal: total,
          total,
          allergies: rows[0].allergies ?? [],
          allergyNote: rows[0].note || null,
          submittedAt: new Date(),
        },
      });
      orders++;

      // Replace the day list wholesale: re-running must not double it up.
      await prisma.orderDay.deleteMany({ where: { orderId: order.id } });

      for (const r of rows) {
        const { parent } = rowCharges(r);
        const orderDay = await prisma.orderDay.create({
          data: {
            orderId: order.id,
            date: utcDate(r.iso),
            price: parent,
            // Per day, not per order: the same student can have a real sheet
            // on one date and stand-in data on the next.
            source: r.source === 'real' ? 'SERVICE_SHEET' : 'SAMPLE',
          },
        });
        days++;

        const mealRows = [];
        for (const slot of ['breakfast', 'lunch', 'brunch']) {
          const value = r[slot];
          if (!value) continue;
          const isChef = value === CHEF_CHOICE;
          const price = MENU_PRICING[value];
          mealRows.push({
            orderDayId: orderDay.id,
            mealType: SLOT_TYPE[slot],
            mode: isChef ? 'CHEF' : 'CUSTOM',
            menuItemId: isChef ? null : itemByName.get(value) ?? null,
            itemNameSnapshot: isChef ? null : value,
            unitParentPrice: isChef ? 0 : price?.parentPrice ?? 0,
            unitVendorCost: isChef ? 0 : price?.vendorCost ?? 0,
          });
        }
        if (mealRows.length) {
          await prisma.orderMeal.createMany({ data: mealRows });
          meals += mealRows.length;
        }
      }
    }
    console.log(`  ${m.key}: ${byStudent.size} students`);
  }

  console.log(`\n  Order      ${orders}`);
  console.log(`  OrderDay   ${days}`);
  console.log(`  OrderMeal  ${meals}`);
  if (skipped) console.log(`  skipped    ${skipped} (no matching Student row)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
