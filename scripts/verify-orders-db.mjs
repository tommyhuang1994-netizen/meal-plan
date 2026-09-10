// Does the database produce the same bill as the in-code store?
// If these disagree, the port has changed what the school charges.
import { config } from 'dotenv';
config({ path: ['.env.local', '.env'], quiet: true });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { monthlyBill } from '../lib/billing.js';
import { getOrdersForDate } from '../lib/orderStore.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

for (const [key, year, month] of [['2026-08', 2026, 8], ['2026-09', 2026, 9]]) {
  const cycle = await prisma.orderCycle.findUnique({ where: { year_month: { year, month } } });
  const agg = await prisma.orderDay.aggregate({
    where: { order: { cycleId: cycle.id } },
    _sum: { price: true },
    _count: true,
  });
  const code = monthlyBill(key);
  const dbTotal = Number(agg._sum.price ?? 0);

  console.log(`${key}`);
  console.log(`  order-days   db ${String(agg._count).padStart(5)}   code ${String(code.orderedDays).padStart(5)}   ${agg._count === code.orderedDays ? 'match' : 'MISMATCH'}`);
  console.log(`  parent total db ${dbTotal.toFixed(2).padStart(9)}   code ${code.parentTotal.toFixed(2).padStart(9)}   ${dbTotal.toFixed(2) === code.parentTotal.toFixed(2) ? 'match' : 'MISMATCH'}`);
}

// The one day backed by a real service sheet.
const day = await prisma.orderDay.findMany({
  where: { date: new Date('2026-09-14T00:00:00.000Z') },
  include: { meals: true, order: { include: { student: true } } },
});
const bf = day.filter(d => d.meals.some(m => m.mealType === 'BREAKFAST')).length;
const ln = day.filter(d => d.meals.some(m => m.mealType === 'LUNCH')).length;
console.log(`\n14 Sep from the database: ${day.length} people, ${bf} breakfast, ${ln} lunch`);
console.log('  (service sheet said: 62 people, 41 breakfast, 50 lunch)');

const codeRows = getOrdersForDate('2026-09', 14);
console.log(`  in-code store: ${codeRows.length} people`);

const bySource = await prisma.order.groupBy({ by: ['source'], _count: true });
console.log('\norders by source:');
for (const s of bySource) console.log(`  ${s.source.padEnd(15)} ${s._count}`);

await prisma.$disconnect();
