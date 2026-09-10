// What is actually in Supabase right now, and what still is not.
import { config } from 'dotenv';
config({ path: ['.env.local', '.env'], quiet: true });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const [orders, days, meals, changes, invoices] = await Promise.all([
  prisma.order.count(),
  prisma.orderDay.count(),
  prisma.orderMeal.count(),
  prisma.orderDayChange.count(),
  prisma.invoice.count(),
]);

console.log('ordering data in Supabase');
console.log(`  Order           ${orders}`);
console.log(`  OrderDay        ${days}`);
console.log(`  OrderMeal       ${meals}`);
console.log(`  OrderDayChange  ${changes}`);
console.log(`  Invoice         ${invoices}`);

const bySource = await prisma.orderDay.groupBy({ by: ['source'], _count: true });
console.log('\norder-days by provenance');
for (const s of bySource) console.log(`  ${s.source.padEnd(15)} ${s._count}`);

const byCycle = await prisma.orderCycle.findMany({
  select: { year: true, month: true, _count: { select: { orders: true } } },
  orderBy: [{ year: 'asc' }, { month: 'asc' }],
});
console.log('\nby cycle');
for (const c of byCycle) {
  console.log(`  ${c.year}-${String(c.month).padStart(2, '0')}   ${c._count.orders} orders`);
}

const cancelled = await prisma.order.count({ where: { status: 'CANCELLED' } });
const portal = await prisma.order.count({ where: { source: 'PARENT_PORTAL' } });
console.log(`\ncancelled orders: ${cancelled}`);
console.log(`orders placed through the portal: ${portal}`);

await prisma.$disconnect();
