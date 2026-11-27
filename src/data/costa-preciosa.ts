// Costa Preciosa lot layout, from the AAAC area breakdown (AAAC_System.pdf).
// Used by the database seed and by the site plan drawn on the login screen.

export const PROJECT = { name: "Costa Preciosa", grossArea: "11490.000" } as const;

export type BlockPlan = { name: string; area: string; lots: [letter: string, areaSqm: number][] };

// Saleable lots by block: [letter, area in sq.m.]. Lot codes are "466-" + letter.
export const BLOCKS: BlockPlan[] = [
  {
    name: "1",
    area: "1053.000",
    lots: [["A", 137], ["B", 132], ["C", 120], ["D", 120], ["E", 200], ["F", 180], ["G", 164]],
  },
  {
    name: "2A",
    area: "1171.000",
    lots: [
      ["H", 146], ["I", 150], ["J", 150], ["K", 125], ["L", 100],
      ["M", 100], ["N", 100], ["O", 100], ["P", 100], ["Q", 100],
    ],
  },
  {
    name: "2B",
    area: "860.000",
    lots: [
      ["R", 100], ["S", 80], ["T", 80], ["U", 200], ["V", 80],
      ["W", 80], ["X", 80], ["Y", 80], ["Z", 80],
    ],
  },
  {
    name: "3",
    area: "674.000",
    lots: [["AA", 110], ["BB", 110], ["CC", 150], ["DD", 100], ["EE", 100], ["FF", 104]],
  },
  {
    name: "4",
    area: "802.000",
    lots: [["GG", 120], ["HH", 120], ["II", 100], ["JJ", 100], ["KK", 101], ["LL", 101], ["MM", 160]],
  },
];

export const SALEABLE_LOT_COUNT = BLOCKS.reduce((n, b) => n + b.lots.length, 0); // 39
export const SALEABLE_AREA = BLOCKS.reduce((n, b) => n + b.lots.reduce((m, [, a]) => m + a, 0), 0); // 4,560
