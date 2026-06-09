// Per-date menu data for June 2026
// Fridays have brunch only; Mon-Thu have breakfast + lunch

const BF = [
  { name: 'Nasi Lemak',    desc: 'Coconut rice, egg, sambal',            price: 3.50 },
  { name: 'Roti Canai',    desc: 'Flaky flatbread with dhal curry',       price: 3.00 },
  { name: 'Nasi Goreng',   desc: 'Fried rice with egg & vegetables',      price: 4.00 },
  { name: 'Sandwich Set',  desc: 'Egg mayo sandwich & milo',              price: 4.50 },
  { name: 'Mihun Soup',    desc: 'Vermicelli in clear chicken broth',     price: 3.50 },
  { name: 'Bread & Butter',desc: 'Toast with kaya & butter, milo',        price: 3.00 },
  { name: 'Chapati Set',   desc: 'Chapati with curry & dhal',             price: 4.00 },
  { name: 'Mee Soup',      desc: 'Yellow noodles in chicken soup',        price: 3.50 },
  { name: 'Roti Telur',    desc: 'Egg flatbread with curry sauce',        price: 4.00 },
  { name: 'Oat Porridge',  desc: 'Warm oats with honey & fruit',          price: 3.50 },
];

const LN = [
  { name: 'Chicken Rice',       desc: 'Steamed chicken, fragrant rice, soup',    price: 5.50 },
  { name: 'Mee Goreng',         desc: 'Fried noodles with vegetables & egg',     price: 5.00 },
  { name: 'Economy Rice',       desc: 'Steamed rice with 2 lauk choices',        price: 5.50 },
  { name: 'Pasta Bolognese',    desc: 'Spaghetti with chicken bolognaise sauce', price: 6.00 },
  { name: 'Nasi Campur',        desc: 'Mixed rice with 3 side dishes',           price: 6.50 },
  { name: 'Chicken Chop',       desc: 'Grilled chicken chop, fries, coleslaw',   price: 7.00 },
  { name: 'Fried Rice Set',     desc: 'Wok fried rice with chicken & soup',      price: 5.50 },
  { name: 'Nasi Ayam Penyet',   desc: 'Smashed fried chicken, sambal, rice',     price: 6.50 },
  { name: 'Mee Mamak',          desc: 'Spicy Indian-style fried noodles',        price: 5.50 },
  { name: 'Steam Ginger Chicken',desc:'Steamed rice, ginger chicken, vege',      price: 7.00 },
  { name: 'Nasi Goreng USA',    desc: 'Fried rice with chicken chop & egg',      price: 6.00 },
  { name: 'Fish & Chips',       desc: 'Battered fish fillet, fries, tartar',     price: 7.00 },
];

const BR = [
  { name: 'Big Breakfast Plate', desc: 'Eggs, toast, baked beans, sausage',       price: 7.50 },
  { name: 'Nasi Lemak Special',  desc: 'Coconut rice, rendang, egg, ulam',        price: 7.00 },
  { name: 'Pancake Stack',       desc: 'Fluffy pancakes, maple syrup, fruit',     price: 6.50 },
  { name: 'Waffles & Fruit',     desc: 'Belgian waffles, cream, seasonal fruit',  price: 7.00 },
];

// Build items with stable IDs from a pool, picking at offset
function pick(pool, offset, count) {
  return Array.from({ length: count }, (_, i) => {
    const item = pool[(offset + i) % pool.length];
    return { id: `${offset}-${i}-${item.name.replace(/\s/g,'')}`, ...item };
  });
}

// Generate all school days (Mon-Fri) in June 2026
function buildMenu() {
  const menu = {};
  let bfOffset = 0, lnOffset = 0, brOffset = 0;

  for (let d = 1; d <= 30; d++) {
    const dow = new Date(2026, 5, d).getDay(); // 0=Sun, 6=Sat
    if (dow === 0 || dow === 6) continue;

    const key = `2026-06-${String(d).padStart(2, '0')}`;

    if (dow === 5) {
      // Friday — brunch only
      menu[key] = { brunch: pick(BR, brOffset, 3) };
      brOffset += 2;
    } else {
      menu[key] = {
        breakfast: pick(BF, bfOffset, 2),
        lunch:     pick(LN, lnOffset, 3),
      };
      bfOffset += 2;
      lnOffset += 3;
    }
  }
  return menu;
}

export const MENU_BY_DATE = buildMenu();

export function getSchoolDays() {
  return Object.keys(MENU_BY_DATE).map(k => parseInt(k.split('-')[2])).sort((a, b) => a - b);
}

export function isFridayDate(date) {
  return new Date(2026, 5, date).getDay() === 5;
}

export function dateKey(date) {
  return `2026-06-${String(date).padStart(2, '0')}`;
}

export function dayLabel(date) {
  const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return names[new Date(2026, 5, date).getDay()];
}

export function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
