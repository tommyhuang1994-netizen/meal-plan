// Seeds the database from the existing static modules in lib/.
//
// This is the bridge off the hardcoded data: lib/menuData.js, lib/pricingData.js
// and lib/schoolCalendar.js stay as the source of truth for September 2026 until the
// admin UI can create cycles itself. Idempotent — safe to re-run.
// Loaded here too so `node prisma/seed.js` works outside the Prisma CLI.
import { config } from 'dotenv';
config({ path: ['.env.local', '.env'], quiet: true });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { MENU_BY_DATE } from '../lib/menuData.js';
import { CHEFS_PRICING, MENU_PRICING } from '../lib/pricingData.js';
import { CALENDAR_GROUPS, getBlockedDaysList } from '../lib/schoolCalendar.js';
import { PARENT_CHILDREN } from '../lib/orderStore.js';
import { STUDENTS, ALLERGY_DECLARATIONS } from '../lib/students.js';
import { hashPassword } from '../lib/password.js';

// Seeding writes schema-owned rows, so use the direct (unpooled) connection.
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const CYCLE_YEAR = 2026;
const CYCLE_MONTH = 9; // September

const MEAL_TYPE = { Breakfast: 'BREAKFAST', Lunch: 'LUNCH', Brunch: 'BRUNCH' };
const GROUP = {
  Cambridge: 'CAMBRIDGE',
  Homeschool: 'HOMESCHOOL',
  Plus: 'PLUS',
  Staff: 'STAFF',
};

/// @db.Date reads the UTC calendar date off a JS Date. Building with Date.UTC
/// keeps "2026-09-22" as the 22nd regardless of the machine's timezone.
const utcDate = (iso) => new Date(`${iso}T00:00:00.000Z`);

// ── Descriptions ──────────────────────────────────────────────────────────────
// MENU_PRICING has the authoritative prices but no descriptions; MENU_BY_DATE
// has descriptions. Walk the calendar to collect them.
function collectDescriptions() {
  const byName = {};
  for (const day of Object.values(MENU_BY_DATE)) {
    for (const items of Object.values(day)) {
      for (const item of items) {
        if (!byName[item.name]) byName[item.name] = item.desc;
      }
    }
  }
  return byName;
}

async function seedMenuItems() {
  const descriptions = collectDescriptions();
  const byName = {};

  // MenuItem.vendorCost is NOT NULL. If lib/pricingData.js ever carries a null
  // cost again (a new meal type, a month whose cost list has not arrived), stop
  // with an actionable message rather than dying on a Prisma constraint error
  // halfway through the seed.
  const uncosted = Object.entries(MENU_PRICING).filter(([, p]) => p.vendorCost == null);
  if (uncosted.length) {
    throw new Error(
      `${uncosted.length} of ${Object.keys(MENU_PRICING).length} menu items have no vendorCost ` +
      `(e.g. "${uncosted[0][0]}").\n` +
      `MenuItem.vendorCost is NOT NULL, so seeding cannot proceed. Either:\n` +
      `  1. fill in the real costs in lib/pricingData.js, or\n` +
      `  2. make the column optional (vendorCost Decimal? in prisma/schema.prisma) + migrate.\n` +
      `Costs were deliberately left null rather than guessed — see the note in lib/pricingData.js.`
    );
  }

  for (const [name, price] of Object.entries(MENU_PRICING)) {
    const item = await prisma.menuItem.upsert({
      where: { name },
      update: {
        description: descriptions[name] ?? '',
        mealType: MEAL_TYPE[price.type],
        vendorCost: price.vendorCost,
        parentPrice: price.parentPrice,
      },
      create: {
        name,
        description: descriptions[name] ?? '',
        mealType: MEAL_TYPE[price.type],
        vendorCost: price.vendorCost,
        parentPrice: price.parentPrice,
      },
    });
    byName[name] = item;
  }

  console.log(`  MenuItem       ${Object.keys(byName).length}`);
  return byName;
}

async function seedPlans() {
  for (const plan of CHEFS_PRICING) {
    const data = {
      label: plan.label,
      note: plan.note,
      vendorCost: plan.vendorCost,
      parentPrice: plan.parentPrice,
      // The Meal Set is billed across every study day in the cycle, not per
      // day the parent picks.
      pricing: plan.id === 'chefs_set_daily' ? 'PER_STUDY_DAY' : 'PER_DAY_RATE',
    };
    await prisma.planOption.upsert({
      where: { code: plan.id },
      update: data,
      create: { code: plan.id, ...data },
    });
  }
  console.log(`  PlanOption     ${CHEFS_PRICING.length}`);
}

async function seedMenuOfferings(itemsByName) {
  let count = 0;
  for (const [iso, meals] of Object.entries(MENU_BY_DATE)) {
    const date = utcDate(iso);
    for (const [meal, items] of Object.entries(meals)) {
      const mealType = MEAL_TYPE[meal[0].toUpperCase() + meal.slice(1)];
      for (const [i, item] of items.entries()) {
        const menuItem = itemsByName[item.name];
        if (!menuItem) continue;
        await prisma.menuOffering.upsert({
          where: {
            date_mealType_menuItemId: { date, mealType, menuItemId: menuItem.id },
          },
          update: { sortOrder: i },
          create: { date, mealType, menuItemId: menuItem.id, sortOrder: i },
        });
        count++;
      }
    }
  }
  console.log(`  MenuOffering   ${count}`);
}

async function seedCalendarBlocks() {
  let count = 0;
  for (const group of Object.keys(CALENDAR_GROUPS)) {
    for (const block of getBlockedDaysList(group)) {
      const date = utcDate(`2026-09-${String(block.date).padStart(2, "0")}`);
      const data = {
        kind: block.type === 'break' ? 'BREAK' : 'HOLIDAY',
        name: block.name,
      };
      await prisma.calendarBlock.upsert({
        where: { date_classGroup: { date, classGroup: GROUP[group] } },
        update: data,
        create: { date, classGroup: GROUP[group], ...data },
      });
      count++;
    }
  }
  console.log(`  CalendarBlock  ${count}`);
}

async function seedCycle() {
  const cycle = await prisma.orderCycle.upsert({
    where: { year_month: { year: CYCLE_YEAR, month: CYCLE_MONTH } },
    update: {},
    create: { year: CYCLE_YEAR, month: CYCLE_MONTH, status: 'OPEN' },
  });
  console.log(`  OrderCycle     1 (${CYCLE_YEAR}-${String(CYCLE_MONTH).padStart(2, '0')})`);
  return cycle;
}

// ── People ────────────────────────────────────────────────────────────────────
// Dev credentials only. Replace before this touches a real school.
async function seedUsers() {
  const accounts = [
    { email: 'admin@zera.test',  name: 'School Admin', role: 'ADMIN',  password: 'admin123' },
    { email: 'vendor@zera.test', name: 'Kitchen Vendor', role: 'VENDOR', password: 'vendor123' },
    { email: 'parent@zera.test', name: 'Demo Parent',  role: 'PARENT', password: 'parent123' },
  ];

  const byRole = {};
  for (const acc of accounts) {
    const passwordHash = await hashPassword(acc.password);
    byRole[acc.role] = await prisma.user.upsert({
      where: { email: acc.email },
      update: { name: acc.name, role: acc.role },
      create: { email: acc.email, name: acc.name, role: acc.role, passwordHash },
    });
  }
  console.log(`  User           ${accounts.length}`);
  return byRole;
}

/// The real roster from the September 2026 form responses.
async function seedStudents(parent) {
  for (const s of STUDENTS) {
    const data = {
      classGroup: GROUP[s.dept],
      year: s.year,
      allergies: s.allergies ?? [],
      // The parent's own wording, which the chips cannot carry: "Broad Bean
      // (G6PD)", "Aloe vera" and "no beef" match no chip at all.
      allergyNote: s.note || null,
      // Only the children the parent portal shows belong to the demo parent.
      parentId: PARENT_CHILDREN.includes(s.name) ? parent.id : null,
    };
    const found = await prisma.student.findFirst({ where: { name: s.name } });
    if (found) await prisma.student.update({ where: { id: found.id }, data });
    else await prisma.student.create({ data: { name: s.name, ...data } });
  }
  console.log(`  Student        ${STUDENTS.length}`);
}

/// Allergy declarations with no name attached. Three responses carry a class
/// and a timestamp but no readable name, one of them a peanut allergy — they
/// are seeded as unresolved so the warning stays visible until an admin can
/// match it to a child.
async function seedAllergyDeclarations() {
  let resolved = 0;
  for (const d of ALLERGY_DECLARATIONS) {
    // "21/08/2026 11:38:57" — day/month/year, local time.
    const [date, time] = d.submitted.split(' ');
    const [dd, mm, yyyy] = date.split('/').map(Number);
    const [hh, mi, ss] = time.split(':').map(Number);
    const submittedAt = new Date(yyyy, mm - 1, dd, hh, mi, ss);

    const found = await prisma.allergyDeclaration.findFirst({ where: { submittedAt } });
    // A resolved declaration points at the student it belongs to, so the
    // evidence for the match survives in the database.
    const student = d.resolvedTo
      ? await prisma.student.findFirst({ where: { name: d.resolvedTo } })
      : null;
    if (d.resolvedTo && !student) throw new Error(`resolvedTo names no student: ${d.resolvedTo}`);
    if (student) resolved++;

    const data = {
      submittedAt,
      classGroup: GROUP[d.dept],
      year: d.year,
      allergies: d.allergies ?? [],
      note: d.note,
      resolvedStudentId: student?.id ?? null,
      resolvedAt: student ? new Date() : null,
    };
    if (found) await prisma.allergyDeclaration.update({ where: { id: found.id }, data });
    else await prisma.allergyDeclaration.create({ data });
  }
  console.log(`  AllergyDecl    ${ALLERGY_DECLARATIONS.length} (${resolved} resolved)`);
}

/// Which meals each group may order. Every group may take every meal: the
/// form's Breakfast-only line for PLUS is out of date, and enforcing it would
/// have blocked orders the kitchen actually served.
async function seedClassGroupRules() {
  const ALL = ['BREAKFAST', 'LUNCH', 'BRUNCH'];
  const rules = [
    { classGroup: 'CAMBRIDGE', allowedMeals: ALL, note: null },
    { classGroup: 'HOMESCHOOL', allowedMeals: ALL, note: null },
    { classGroup: 'STAFF', allowedMeals: ALL, note: null },
    // The order form still says "Zera PLUS students are eligible for Breakfast
    // only", but the school confirms that is out of date and its own 14
    // September service sheet has a Plus student taking lunch (ong shi chen).
    // The sheet is the record of what was actually served, so it wins.
    { classGroup: 'PLUS', allowedMeals: ALL, note: null },
  ];
  for (const r of rules) {
    await prisma.classGroupRule.upsert({
      where: { classGroup: r.classGroup },
      update: { allowedMeals: r.allowedMeals, note: r.note },
      create: r,
    });
  }
  console.log(`  ClassGroupRule ${rules.length}`);
}

async function seedSettings() {
  const settings = [
    // No standalone combo discount: the only both-meals promotion is priced
    // into the chefs_both plan itself (RM 18.00 vs RM 19.00), and it applies to
    // Chef's Choice pairs only — never to two à-la-carte picks.
    { key: 'combo_discount', value: '0.00' },
    { key: 'currency', value: 'MYR' },
    { key: 'timezone', value: 'Asia/Kuala_Lumpur' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }
  console.log(`  Setting        ${settings.length}`);
}

async function main() {
  console.log('Seeding…');
  const items = await seedMenuItems();
  await seedPlans();
  await seedMenuOfferings(items);
  await seedCalendarBlocks();
  await seedCycle();
  const users = await seedUsers();
  await seedStudents(users.PARENT);
  await seedAllergyDeclarations();
  await seedClassGroupRules();
  await seedSettings();
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
