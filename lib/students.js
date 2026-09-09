// The student and staff roster, from the ZERA Meal Plan September 2026 form
// responses (68 submissions, 67 distinct people).
//
// !! ALLERGIES ARE EMPTY !!
// The responses PDF this was read from clips its columns, and no allergy value
// survived extraction. The vendor print sheet renders allergy chips from this
// field, so it will show none until the real answers are loaded from the
// linked responses spreadsheet. Do not treat an empty list as "no allergies".
//
// 9 further responses were dropped: their names are in characters the
// PDF's Latin font could not represent, so no name could be read for them.
//
// Names are the school's own spelling. Entries typed all-upper or all-lower
// were title-cased; deliberate forms were left alone.

export const STUDENTS = [
  { name: 'Hayden',                          dept: 'Cambridge',   year: 'Cambridge Plus', allergies: [] },
  { name: 'Asher Ng',                        dept: 'Cambridge',   year: 'Year 1',         allergies: [] },
  { name: 'Ethan.Chang',                     dept: 'Cambridge',   year: 'Year 1',         allergies: [] },
  { name: 'Ho Zi Cc Astrid',                 dept: 'Cambridge',   year: 'Year 1',         allergies: [] },
  { name: 'Lucas Ling Sheng Jie',            dept: 'Cambridge',   year: 'Year 1',         allergies: [] },
  { name: 'Marco chia guan fu',              dept: 'Cambridge',   year: 'Year 1',         allergies: [] },
  { name: 'Park Ji Hoon',                    dept: 'Cambridge',   year: 'Year 1',         allergies: [] },
  { name: 'Yap Yu Qian',                     dept: 'Cambridge',   year: 'Year 1',         allergies: [] },
  { name: 'Berries Choo Le Xuen',            dept: 'Cambridge',   year: 'Year 10',        allergies: [] },
  { name: 'Dior Soh Yee En',                 dept: 'Cambridge',   year: 'Year 10',        allergies: [] },
  { name: 'Marilyn Liew shan Lin',           dept: 'Cambridge',   year: 'Year 10',        allergies: [] },
  { name: 'Sin Yuan Loong',                  dept: 'Cambridge',   year: 'Year 10',        allergies: [] },
  { name: 'Tan Jun Ming',                    dept: 'Cambridge',   year: 'Year 10',        allergies: [] },
  { name: 'Wallce Lian Cheng Dian',          dept: 'Cambridge',   year: 'Year 10',        allergies: [] },
  { name: 'Aleysha',                         dept: 'Cambridge',   year: 'Year 11',        allergies: [] },
  { name: 'Hannela',                         dept: 'Cambridge',   year: 'Year 11',        allergies: [] },
  { name: 'Jackhu',                          dept: 'Cambridge',   year: 'Year 11',        allergies: [] },
  { name: 'Lai Wei Qi',                      dept: 'Cambridge',   year: 'Year 11',        allergies: [] },
  { name: 'Liang Kai Bin',                   dept: 'Cambridge',   year: 'Year 11',        allergies: [] },
  { name: 'XuNuoEr',                         dept: 'Cambridge',   year: 'Year 11',        allergies: [] },
  { name: 'Ethan Chiah',                     dept: 'Cambridge',   year: 'Year 2',         allergies: [] },
  { name: 'Berenice Tan Jia En',             dept: 'Cambridge',   year: 'Year 3',         allergies: [] },
  { name: 'Cheng Wen Xuan',                  dept: 'Cambridge',   year: 'Year 3',         allergies: [] },
  { name: 'Lee En Chee',                     dept: 'Cambridge',   year: 'Year 3',         allergies: [] },
  { name: 'Peter John A. Pizon',             dept: 'Cambridge',   year: 'Year 3',         allergies: [] },
  { name: 'Sean Ng Chen Feng',               dept: 'Cambridge',   year: 'Year 3',         allergies: [] },
  { name: 'Tiffany Michael',                 dept: 'Cambridge',   year: 'Year 3',         allergies: [] },
  { name: 'Ervina Isabelle Selvanesan',      dept: 'Cambridge',   year: 'Year 4',         allergies: [] },
  { name: 'Kho Chen Xi',                     dept: 'Cambridge',   year: 'Year 4',         allergies: [] },
  { name: 'Dominic Carl Tan',                dept: 'Cambridge',   year: 'Year 5',         allergies: [] },
  { name: 'Lucas Choo Jia Le',               dept: 'Cambridge',   year: 'Year 5',         allergies: [] },
  { name: 'Shawn Chong',                     dept: 'Cambridge',   year: 'Year 5',         allergies: [] },
  { name: 'Vanessa Ng Yu Xuan',              dept: 'Cambridge',   year: 'Year 5',         allergies: [] },
  { name: 'Anston Ho Zi Xue',                dept: 'Cambridge',   year: 'Year 6',         allergies: [] },
  { name: 'Hadif',                           dept: 'Cambridge',   year: 'Year 6',         allergies: [] },
  { name: 'Ng Guo Jun',                      dept: 'Cambridge',   year: 'Year 6',         allergies: [] },
  { name: 'Nicholas Lim Zhi Yun',            dept: 'Cambridge',   year: 'Year 6',         allergies: [] },
  { name: 'Chong Jia Hao',                   dept: 'Cambridge',   year: 'Year 7',         allergies: [] },
  { name: 'Hashini Venotarao',               dept: 'Cambridge',   year: 'Year 7',         allergies: [] },
  { name: 'Ng Jun Hee',                      dept: 'Cambridge',   year: 'Year 7',         allergies: [] },
  { name: 'Putri Priscilla Ho Huai En',      dept: 'Cambridge',   year: 'Year 7',         allergies: [] },
  { name: 'Xie Zhuo Han',                    dept: 'Cambridge',   year: 'Year 7',         allergies: [] },
  { name: 'Zhong Yuchen',                    dept: 'Cambridge',   year: 'Year 7',         allergies: [] },
  { name: 'Cheah wen qi',                    dept: 'Cambridge',   year: 'Year 8',         allergies: [] },
  { name: 'Lashmeita Thiagian',              dept: 'Cambridge',   year: 'Year 8',         allergies: [] },
  { name: 'Leow Mee Kee',                    dept: 'Cambridge',   year: 'Year 8',         allergies: [] },
  { name: 'Wong Jia Wei',                    dept: 'Cambridge',   year: 'Year 8',         allergies: [] },
  { name: 'Lee xie',                         dept: 'Cambridge',   year: 'Year 9',         allergies: [] },
  { name: 'Thong',                           dept: 'Cambridge',   year: 'Year 9',         allergies: [] },
  { name: 'Wong Zi Hao',                     dept: 'Cambridge',   year: 'Year 9',         allergies: [] },
  { name: 'Japheth Ian Yek',                 dept: 'Homeschool',  year: null,             allergies: [] },
  { name: 'Liong Ee Yun',                    dept: 'Homeschool',  year: null,             allergies: [] },
  { name: 'Tan Choon Xi',                    dept: 'Homeschool',  year: null,             allergies: [] },
  { name: 'Timothy Ong',                     dept: 'Homeschool',  year: null,             allergies: [] },
  { name: 'Ho Shian Chee',                   dept: 'Plus',        year: null,             allergies: [] },
  { name: 'Mia hong qian yun',               dept: 'Plus',        year: null,             allergies: [] },
  { name: 'Ong Shi Chen',                    dept: 'Plus',        year: null,             allergies: [] },
  { name: 'Ong Yu Xy',                       dept: 'Plus',        year: null,             allergies: [] },
  { name: 'Tee Kang Jun',                    dept: 'Plus',        year: null,             allergies: [] },
  { name: 'Yoong Chloe',                     dept: 'Plus',        year: null,             allergies: [] },
  { name: 'ei Xi',                           dept: 'Plus',        year: null,             allergies: [] },
  { name: 'Helena Lee Siew Ing',             dept: 'Staff',       year: null,             allergies: [] },
  { name: 'Nur Hazirah Binti Sani',          dept: 'Staff',       year: null,             allergies: [] },
  { name: 'Nurliana Asyikin Binti Azmi',     dept: 'Staff',       year: null,             allergies: [] },
  { name: 'Nurul Hana Faezah Binti Azhari',  dept: 'Staff',       year: null,             allergies: [] },
  { name: 'Teoh Choo Neo',                   dept: 'Staff',       year: null,             allergies: [] },
  { name: 'Wafi Abdul',                      dept: 'Staff',       year: null,             allergies: [] },
];
