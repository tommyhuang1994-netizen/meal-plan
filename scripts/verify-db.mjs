// Reads back what is actually in Postgres, so the seed's own counts are not
// the only evidence it worked. Run: node scripts/verify-db.mjs
import { config } from 'dotenv';
config({ path: ['.env.local', '.env'], quiet: true });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const counts = {
  MenuItem: await prisma.menuItem.count(),
  MenuOffering: await prisma.menuOffering.count(),
  PlanOption: await prisma.planOption.count(),
  CalendarBlock: await prisma.calendarBlock.count(),
  Student: await prisma.student.count(),
  User: await prisma.user.count(),
  OrderCycle: await prisma.orderCycle.count(),
  AllergyDeclaration: await prisma.allergyDeclaration.count(),
  ClassGroupRule: await prisma.classGroupRule.count(),
  Setting: await prisma.setting.count(),
  Order: await prisma.order.count(),
  Invoice: await prisma.invoice.count(),
};
console.log('row counts, read back from Supabase:');
for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(20)} ${v}`);

// The details most likely to have been mangled in transit.
const withNote = await prisma.student.count({ where: { allergyNote: { not: null } } });
console.log(`\nstudents with an allergy note: ${withNote}`);

const plus = await prisma.classGroupRule.findUnique({ where: { classGroup: 'PLUS' } });
console.log(`PLUS allowed meals: ${plus?.allowedMeals.join(', ')}`);

const caps = await prisma.student.findMany({
  where: { name: { in: ['ASHER NG', 'tee kang jun', 'How Pei Xi', 'Kwan Hou Thong'] } },
  select: { name: true, classGroup: true, year: true, allergyNote: true },
});
console.log('\nname casing and recovered names:');
for (const s of caps) {
  console.log(`  ${s.name.padEnd(18)} ${s.classGroup} ${s.year ?? ''} ${s.allergyNote ? '— ' + s.allergyNote : ''}`);
}

const decls = await prisma.allergyDeclaration.findMany({ select: { classGroup: true, year: true, note: true } });
console.log('\nunattributed declarations:');
for (const d of decls) console.log(`  ${d.classGroup} ${d.year ?? ''} — ${d.note}`);

await prisma.$disconnect();
