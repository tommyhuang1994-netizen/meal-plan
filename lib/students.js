// The student and staff roster, from the ZERA Meal Plan September 2026 form
// responses (67 distinct people).
//
// `allergies` are the chips the app renders, matched from the free-text answer.
// `note` keeps the parent's exact wording, because the matching is best-effort
// and the words are what the kitchen must actually read: "Broad Bean (G6PD)"
// and "Aloe vera" have no chip, and losing them would be losing the warning.
// 11 of 67 people declared something.
//
// 9 responses were dropped: their names are in characters the PDF's
// Latin font could not represent.
//
// Names are the school's own spelling. Entries typed all-upper or all-lower
// were title-cased; deliberate forms were left alone.

export const STUDENTS = [
  { name: 'Hayden',                          dept: 'Cambridge',   year: 'Cambridge Plus', allergies: [],            note: '' },
  { name: 'Asher Ng',                        dept: 'Cambridge',   year: 'Year 1',         allergies: [],            note: 'mushroom' },
  { name: 'Ethan.Chang',                     dept: 'Cambridge',   year: 'Year 1',         allergies: [],            note: '' },
  { name: 'Ho Zi Cc Astrid',                 dept: 'Cambridge',   year: 'Year 1',         allergies: [],            note: '' },
  { name: 'Lucas Ling Sheng Jie',            dept: 'Cambridge',   year: 'Year 1',         allergies: ['eggs'],      note: 'Egg White and potato' },
  { name: 'Marco chia guan fu',              dept: 'Cambridge',   year: 'Year 1',         allergies: [],            note: '' },
  { name: 'Park Ji Hoon',                    dept: 'Cambridge',   year: 'Year 1',         allergies: ['eggs'],      note: 'egg' },
  { name: 'Yap Yu Qian',                     dept: 'Cambridge',   year: 'Year 1',         allergies: [],            note: '' },
  { name: 'Berries Choo Le Xuen',            dept: 'Cambridge',   year: 'Year 10',        allergies: [],            note: '' },
  { name: 'Dior Soh Yee En',                 dept: 'Cambridge',   year: 'Year 10',        allergies: [],            note: '' },
  { name: 'Marilyn Liew shan Lin',           dept: 'Cambridge',   year: 'Year 10',        allergies: [],            note: '' },
  { name: 'Sin Yuan Loong',                  dept: 'Cambridge',   year: 'Year 10',        allergies: [],            note: '' },
  { name: 'Tan Jun Ming',                    dept: 'Cambridge',   year: 'Year 10',        allergies: [],            note: '' },
  { name: 'Wallce Lian Cheng Dian',          dept: 'Cambridge',   year: 'Year 10',        allergies: [],            note: '' },
  { name: 'Aleysha',                         dept: 'Cambridge',   year: 'Year 11',        allergies: [],            note: '' },
  { name: 'Hannela',                         dept: 'Cambridge',   year: 'Year 11',        allergies: [],            note: '' },
  { name: 'Jackhu',                          dept: 'Cambridge',   year: 'Year 11',        allergies: ['eggs'],      note: 'egg' },
  { name: 'Lai Wei Qi',                      dept: 'Cambridge',   year: 'Year 11',        allergies: [],            note: '' },
  { name: 'Liang Kai Bin',                   dept: 'Cambridge',   year: 'Year 11',        allergies: [],            note: '' },
  { name: 'XuNuoEr',                         dept: 'Cambridge',   year: 'Year 11',        allergies: [],            note: '' },
  { name: 'Ethan Chiah',                     dept: 'Cambridge',   year: 'Year 2',         allergies: [],            note: '' },
  { name: 'Berenice Tan Jia En',             dept: 'Cambridge',   year: 'Year 3',         allergies: [],            note: '' },
  { name: 'Cheng Wen Xuan',                  dept: 'Cambridge',   year: 'Year 3',         allergies: [],            note: 'Broad Bean (G6PD)' },
  { name: 'Lee En Chee',                     dept: 'Cambridge',   year: 'Year 3',         allergies: ['dairy'],     note: 'milk' },
  { name: 'Peter John A. Pizon',             dept: 'Cambridge',   year: 'Year 3',         allergies: ['eggs'],      note: 'Too much egg' },
  { name: 'Sean Ng Chen Feng',               dept: 'Cambridge',   year: 'Year 3',         allergies: [],            note: '' },
  { name: 'Tiffany Michael',                 dept: 'Cambridge',   year: 'Year 3',         allergies: ['noSpicy'],   note: 'no spicy' },
  { name: 'Ervina Isabelle Selvanesan',      dept: 'Cambridge',   year: 'Year 4',         allergies: [],            note: 'Aloe vera' },
  { name: 'Kho Chen Xi',                     dept: 'Cambridge',   year: 'Year 4',         allergies: [],            note: '' },
  { name: 'Dominic Carl Tan',                dept: 'Cambridge',   year: 'Year 5',         allergies: [],            note: '' },
  { name: 'Lucas Choo Jia Le',               dept: 'Cambridge',   year: 'Year 5',         allergies: [],            note: '' },
  { name: 'Shawn Chong',                     dept: 'Cambridge',   year: 'Year 5',         allergies: [],            note: '' },
  { name: 'Vanessa Ng Yu Xuan',              dept: 'Cambridge',   year: 'Year 5',         allergies: [],            note: '' },
  { name: 'Anston Ho Zi Xue',                dept: 'Cambridge',   year: 'Year 6',         allergies: [],            note: '' },
  { name: 'Hadif',                           dept: 'Cambridge',   year: 'Year 6',         allergies: [],            note: '' },
  { name: 'Ng Guo Jun',                      dept: 'Cambridge',   year: 'Year 6',         allergies: [],            note: '' },
  { name: 'Nicholas Lim Zhi Yun',            dept: 'Cambridge',   year: 'Year 6',         allergies: [],            note: '' },
  { name: 'Chong Jia Hao',                   dept: 'Cambridge',   year: 'Year 7',         allergies: [],            note: '' },
  { name: 'Hashini Venotarao',               dept: 'Cambridge',   year: 'Year 7',         allergies: [],            note: '' },
  { name: 'Ng Jun Hee',                      dept: 'Cambridge',   year: 'Year 7',         allergies: [],            note: '' },
  { name: 'Putri Priscilla Ho Huai En',      dept: 'Cambridge',   year: 'Year 7',         allergies: [],            note: '' },
  { name: 'Xie Zhuo Han',                    dept: 'Cambridge',   year: 'Year 7',         allergies: [],            note: '' },
  { name: 'Zhong Yuchen',                    dept: 'Cambridge',   year: 'Year 7',         allergies: [],            note: '' },
  { name: 'Cheah wen qi',                    dept: 'Cambridge',   year: 'Year 8',         allergies: [],            note: '' },
  { name: 'Lashmeita Thiagian',              dept: 'Cambridge',   year: 'Year 8',         allergies: [],            note: '' },
  { name: 'Leow Mee Kee',                    dept: 'Cambridge',   year: 'Year 8',         allergies: [],            note: '' },
  { name: 'Wong Jia Wei',                    dept: 'Cambridge',   year: 'Year 8',         allergies: [],            note: '' },
  { name: 'Lee xie',                         dept: 'Cambridge',   year: 'Year 9',         allergies: [],            note: '' },
  { name: 'Thong',                           dept: 'Cambridge',   year: 'Year 9',         allergies: [],            note: '' },
  { name: 'Wong Zi Hao',                     dept: 'Cambridge',   year: 'Year 9',         allergies: [],            note: '' },
  { name: 'Japheth Ian Yek',                 dept: 'Homeschool',  year: null,             allergies: [],            note: '' },
  { name: 'Liong Ee Yun',                    dept: 'Homeschool',  year: null,             allergies: [],            note: '' },
  { name: 'Tan Choon Xi',                    dept: 'Homeschool',  year: null,             allergies: [],            note: '' },
  { name: 'Timothy Ong',                     dept: 'Homeschool',  year: null,             allergies: [],            note: '' },
  { name: 'Ho Shian Chee',                   dept: 'Plus',        year: null,             allergies: [],            note: '' },
  { name: 'Mia hong qian yun',               dept: 'Plus',        year: null,             allergies: ['treeNuts'],  note: 'nuts' },
  { name: 'Ong Shi Chen',                    dept: 'Plus',        year: null,             allergies: [],            note: '' },
  { name: 'Ong Yu Xy',                       dept: 'Plus',        year: null,             allergies: [],            note: '' },
  { name: 'Tee Kang Jun',                    dept: 'Plus',        year: null,             allergies: [],            note: 'no beef' },
  { name: 'Yoong Chloe',                     dept: 'Plus',        year: null,             allergies: [],            note: '' },
  { name: 'ei Xi',                           dept: 'Plus',        year: null,             allergies: [],            note: '' },
  { name: 'Helena Lee Siew Ing',             dept: 'Staff',       year: null,             allergies: [],            note: '' },
  { name: 'Nur Hazirah Binti Sani',          dept: 'Staff',       year: null,             allergies: [],            note: '' },
  { name: 'Nurliana Asyikin Binti Azmi',     dept: 'Staff',       year: null,             allergies: [],            note: '' },
  { name: 'Nurul Hana Faezah Binti Azhari',  dept: 'Staff',       year: null,             allergies: [],            note: '' },
  { name: 'Teoh Choo Neo',                   dept: 'Staff',       year: null,             allergies: [],            note: '' },
  { name: 'Wafi Abdul',                      dept: 'Staff',       year: null,             allergies: [],            note: '' },
];

// !! DECLARED REQUIREMENTS WE CANNOT PUT A NAME TO !!
// These responses declared an allergy, but their name is in characters the
// PDF's Latin font could not represent. They are kept here rather than
// dropped, because a peanut allergy with nobody's name on it is still a
// warning the kitchen needs. Match them up from the responses spreadsheet.
export const UNATTRIBUTED_ALLERGIES = [
  { submitted: '21/08/2026 11:38:57',   dept: 'Plus',        year: null,       allergies: ['noSpicy'],         note: 'Cannot be spicy' },
  { submitted: '28/08/2026 23:11:54',   dept: 'Cambridge',   year: 'Year 6',   allergies: ['peanuts'],         note: 'peanuts' },
  { submitted: '01/09/2026 10:37:21',   dept: 'Cambridge',   year: 'Year 7',   allergies: ['shellfish'],       note: 'Achovies and seashells' },
];
