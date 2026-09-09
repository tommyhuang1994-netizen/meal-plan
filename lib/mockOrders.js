// Labels shared by the vendor views.
//
// The weekday-keyed mock orders that used to live here are gone: orders now
// come from lib/orderStore.js keyed by real dates, and the roster from
// lib/students.js.

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
