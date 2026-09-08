// Mock student orders for vendor view
// department: 'Cambridge' | 'Homeschool' | 'Plus' | 'Staff'
// year: 'Year 1' ... 'Year 12' | null (for Staff/Plus)

export const ALLERGY_LABELS = {
  peanuts:    { en: 'Peanuts',    zh: '花生',   color: '#DC2626', bg: '#FFF5F5' },
  shellfish:  { en: 'Shellfish',  zh: '贝类',   color: '#EA580C', bg: '#FFF7ED' },
  dairy:      { en: 'Dairy',      zh: '乳制品', color: '#D97706', bg: '#FFFBEB' },
  eggs:       { en: 'Eggs',       zh: '鸡蛋',   color: '#CA8A04', bg: '#FEFCE8' },
  gluten:     { en: 'Gluten',     zh: '麸质',   color: '#7C3AED', bg: '#F5F3FF' },
  treeNuts:   { en: 'Tree Nuts',  zh: '坚果',   color: '#B45309', bg: '#FFFBEB' },
  noSpicy:    { en: 'No Spicy',   zh: '不辣',   color: '#1D4ED8', bg: '#EFF6FF' },
  vegetarian: { en: 'Vegetarian', zh: '素食',   color: '#15803D', bg: '#F0FDF4' },
};

export const DEPARTMENTS = ['All', 'Cambridge', 'Homeschool', 'Plus', 'Staff'];

export const ORDERS = {
  Mon: [
    { name: 'Zhao Xin (Frank)',       dept: 'Cambridge', year: 'Year 10', breakfast: 'Nasi Lemak',    lunch: 'Chicken Rice',  allergies: ['noSpicy'] },
    { name: 'Chok Jie Yao',           dept: 'Cambridge', year: 'Year 5',  breakfast: 'Nasi Lemak',    lunch: 'Chicken Rice',  allergies: [] },
    { name: 'Nicholas Lim Zhi Yun',   dept: 'Cambridge', year: 'Year 5',  breakfast: 'Roti Canai',    lunch: 'Mee Goreng',    allergies: ['peanuts'] },
    { name: 'Wong Zi Hao',            dept: 'Cambridge', year: 'Year 8',  breakfast: 'Nasi Lemak',    lunch: 'Economy Rice',  allergies: [] },
    { name: 'Nurliana Asyikin',        dept: 'Staff',     year: null,      breakfast: 'Roti Canai',    lunch: 'Chicken Rice',  allergies: ['dairy'] },
    { name: 'Nur Hazirah Binti Sani', dept: 'Staff',     year: null,      breakfast: 'Nasi Lemak',    lunch: 'Mee Goreng',    allergies: [] },
    { name: 'Aleysha',                dept: 'Cambridge', year: 'Year 10', breakfast: 'Roti Canai',    lunch: null,            allergies: ['shellfish','noSpicy'] },
    { name: 'Hayden',                 dept: 'Cambridge', year: 'Year 1',  breakfast: 'Nasi Lemak',    lunch: null,            allergies: [] },
    { name: 'Jack Hu',                dept: 'Cambridge', year: 'Year 10', breakfast: 'Roti Canai',    lunch: null,            allergies: ['eggs'] },
    { name: 'Chiah Chen Fong',        dept: 'Cambridge', year: 'Year 1',  breakfast: null,            lunch: 'Economy Rice',  allergies: [] },
    { name: 'Lai Wei Qi',             dept: 'Cambridge', year: 'Year 10', breakfast: null,            lunch: 'Mee Goreng',    allergies: ['vegetarian'] },
    { name: 'Ahmad Irfan',            dept: 'Homeschool',year: 'Year 6',  breakfast: 'Nasi Lemak',    lunch: 'Chicken Rice',  allergies: ['noSpicy'] },
    { name: 'Nur Aisyah',             dept: 'Homeschool',year: 'Year 4',  breakfast: 'Roti Canai',    lunch: 'Chicken Rice', allergies: [] },
    { name: 'Lim Sze Hui',            dept: 'Plus',      year: null,      breakfast: 'Nasi Lemak',    lunch: 'Mee Goreng', allergies: [] },
    { name: 'Tan Wei Jie',            dept: 'Plus',      year: null,      breakfast: null,            lunch: 'Economy Rice', allergies: [] },
  ],
  Tue: [
    { name: 'Zhao Xin (Frank)',       dept: 'Cambridge', year: 'Year 10', breakfast: 'Nasi Goreng',   lunch: 'Pasta Bolognese', allergies: [] },
    { name: 'Chok Jie Yao',           dept: 'Cambridge', year: 'Year 5',  breakfast: 'Sandwich Set',  lunch: 'Nasi Campur', allergies: [] },
    { name: 'Wong Zi Hao',            dept: 'Cambridge', year: 'Year 8',  breakfast: 'Nasi Goreng',   lunch: 'Pasta Bolognese', allergies: [] },
    { name: 'Nurliana Asyikin',        dept: 'Staff',     year: null,      breakfast: 'Nasi Goreng',   lunch: 'Nasi Campur', allergies: [] },
    { name: 'Nur Hazirah Binti Sani', dept: 'Staff',     year: null,      breakfast: 'Sandwich Set',  lunch: 'Pasta Bolognese', allergies: [] },
    { name: 'Kyona Ng Zhi En',        dept: 'Cambridge', year: 'Year 8',  breakfast: 'Nasi Goreng',   lunch: null, allergies: [] },
    { name: 'Nuoer',                  dept: 'Cambridge', year: 'Year 10', breakfast: 'Sandwich Set',  lunch: null, allergies: [] },
    { name: 'Liang Kai Bin',          dept: 'Cambridge', year: 'Year 10', breakfast: null,            lunch: 'Nasi Campur', allergies: [] },
    { name: 'Ahmad Irfan',            dept: 'Homeschool',year: 'Year 6',  breakfast: 'Nasi Goreng',   lunch: 'Pasta Bolognese', allergies: [] },
    { name: 'Nur Aisyah',             dept: 'Homeschool',year: 'Year 4',  breakfast: 'Sandwich Set',  lunch: 'Nasi Campur', allergies: [] },
    { name: 'Lim Sze Hui',            dept: 'Plus',      year: null,      breakfast: 'Nasi Goreng',   lunch: 'Pasta Bolognese', allergies: [] },
  ],
  Wed: [
    { name: 'Zhao Xin (Frank)',       dept: 'Cambridge', year: 'Year 10', breakfast: 'Mihun Soup',    lunch: 'Chicken Chop', allergies: [] },
    { name: 'Nicholas Lim Zhi Yun',   dept: 'Cambridge', year: 'Year 5',  breakfast: 'Bread & Butter',lunch: 'Fried Rice Set', allergies: [] },
    { name: 'Wong Zi Hao',            dept: 'Cambridge', year: 'Year 8',  breakfast: 'Nasi Lemak',    lunch: 'Chicken Chop', allergies: [] },
    { name: 'Nurliana Asyikin',        dept: 'Staff',     year: null,      breakfast: 'Mihun Soup',    lunch: 'Fried Rice Set', allergies: [] },
    { name: 'Hannela',                dept: 'Cambridge', year: 'Year 10', breakfast: 'Bread & Butter',lunch: 'Chicken Chop', allergies: [] },
    { name: 'Blair',                  dept: 'Cambridge', year: 'Year 10', breakfast: 'Nasi Lemak',    lunch: null, allergies: [] },
    { name: 'Tiffany Michael',        dept: 'Cambridge', year: 'Year 2',  breakfast: 'Mihun Soup',    lunch: null, allergies: [] },
    { name: 'Anston Ho Zi Xue',       dept: 'Cambridge', year: 'Year 5',  breakfast: null,            lunch: 'Fried Rice Set', allergies: [] },
    { name: 'Ahmad Irfan',            dept: 'Homeschool',year: 'Year 6',  breakfast: 'Mihun Soup',    lunch: 'Chicken Chop', allergies: [] },
    { name: 'Nur Aisyah',             dept: 'Homeschool',year: 'Year 4',  breakfast: 'Bread & Butter',lunch: 'Fried Rice Set', allergies: [] },
    { name: 'Tan Wei Jie',            dept: 'Plus',      year: null,      breakfast: 'Nasi Lemak',    lunch: 'Chicken Chop', allergies: [] },
  ],
  Thu: [
    { name: 'Zhao Xin (Frank)',       dept: 'Cambridge', year: 'Year 10', breakfast: 'Chapati Set',   lunch: 'Nasi Ayam Penyet', allergies: [] },
    { name: 'Chok Jie Yao',           dept: 'Cambridge', year: 'Year 5',  breakfast: 'Mee Soup',      lunch: 'Mee Mamak', allergies: [] },
    { name: 'Nicholas Lim Zhi Yun',   dept: 'Cambridge', year: 'Year 5',  breakfast: 'Chapati Set',   lunch: 'Nasi Goreng USA', allergies: [] },
    { name: 'Wong Zi Hao',            dept: 'Cambridge', year: 'Year 8',  breakfast: 'Mee Soup',      lunch: 'Nasi Ayam Penyet', allergies: [] },
    { name: 'Nurliana Asyikin',        dept: 'Staff',     year: null,      breakfast: 'Chapati Set',   lunch: 'Mee Mamak', allergies: [] },
    { name: 'Nur Hazirah Binti Sani', dept: 'Staff',     year: null,      breakfast: 'Mee Soup',      lunch: 'Nasi Goreng USA', allergies: [] },
    { name: 'Che Kang You',           dept: 'Cambridge', year: 'Year 1',  breakfast: 'Chapati Set',   lunch: null, allergies: [] },
    { name: 'Jack Hu',                dept: 'Cambridge', year: 'Year 10', breakfast: 'Mee Soup',      lunch: null, allergies: [] },
    { name: 'Hadif',                  dept: 'Cambridge', year: 'Year 5',  breakfast: 'Chapati Set',   lunch: null, allergies: [] },
    { name: 'Lai Wei Qi',             dept: 'Cambridge', year: 'Year 10', breakfast: null,            lunch: 'Nasi Ayam Penyet', allergies: [] },
    { name: 'Liang Kai Bin',          dept: 'Cambridge', year: 'Year 10', breakfast: null,            lunch: 'Mee Mamak', allergies: [] },
    { name: 'Ahmad Irfan',            dept: 'Homeschool',year: 'Year 6',  breakfast: 'Chapati Set',   lunch: 'Nasi Ayam Penyet', allergies: [] },
    { name: 'Nur Aisyah',             dept: 'Homeschool',year: 'Year 4',  breakfast: 'Mee Soup',      lunch: 'Nasi Goreng USA', allergies: [] },
    { name: 'Lim Sze Hui',            dept: 'Plus',      year: null,      breakfast: 'Chapati Set',   lunch: 'Mee Mamak', allergies: [] },
    { name: 'Tan Wei Jie',            dept: 'Plus',      year: null,      breakfast: null,            lunch: 'Nasi Goreng USA', allergies: [] },
  ],
  Fri: [
    { name: 'Zhao Xin (Frank)',       dept: 'Cambridge', year: 'Year 10', brunch: 'Big Breakfast Plate', allergies: [] },
    { name: 'Chok Jie Yao',           dept: 'Cambridge', year: 'Year 5',  brunch: 'Nasi Lemak Special', allergies: [] },
    { name: 'Wong Zi Hao',            dept: 'Cambridge', year: 'Year 8',  brunch: 'Big Breakfast Plate', allergies: [] },
    { name: 'Nurliana Asyikin',        dept: 'Staff',     year: null,      brunch: 'Pancake Stack', allergies: [] },
    { name: 'Nur Hazirah Binti Sani', dept: 'Staff',     year: null,      brunch: 'Nasi Lemak Special', allergies: [] },
    { name: 'Ahmad Irfan',            dept: 'Homeschool',year: 'Year 6',  brunch: 'Big Breakfast Plate', allergies: [] },
    { name: 'Nur Aisyah',             dept: 'Homeschool',year: 'Year 4',  brunch: 'Pancake Stack', allergies: [] },
    { name: 'Lim Sze Hui',            dept: 'Plus',      year: null,      brunch: 'Nasi Lemak Special', allergies: [] },
  ],
};

export const DAY_LABELS = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday',
};

export const MONTH = 'September 2026';

// Returns "Monday - 2nd September 2026" style label for a given weekday occurrence
export function dayTitle(day, occurrence = 1) {
  const dates = { Mon: [1,8,15,22], Tue: [2,9,16,23], Wed: [3,10,17,24,31], Thu: [4,11,18,25], Fri: [5,12,19,26] };
  const date = dates[day]?.[occurrence - 1] ?? dates[day]?.[0];
  const suffix = ['th','st','nd','rd'];
  const v = date % 100;
  const s = suffix[(v - 20) % 10] || suffix[v] || suffix[0];
  return `${DAY_LABELS[day]} - ${date}${s} ${MONTH}`;
}
