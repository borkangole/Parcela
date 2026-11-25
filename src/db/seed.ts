// Seeds the Costa Preciosa project from the AAAC area breakdown (AAAC_System.pdf).
// Safe to run more than once: it updates existing rows instead of duplicating them,
// and never changes a lot's status after it's created (so re-seeding can't undo a sale).
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index";
import { blocks, lots, projects } from "./schema";

const PROJECT = { name: "Costa Preciosa", grossArea: "11490.000" };

// Saleable lots by block: [letter, area in sq.m.]
const BLOCKS: Record<string, { area: string; lots: [string, number][] }> = {
  "1": {
    area: "1053.000",
    lots: [["A", 137], ["B", 132], ["C", 120], ["D", 120], ["E", 200], ["F", 180], ["G", 164]],
  },
  "2A": {
    area: "1171.000",
    lots: [
      ["H", 146], ["I", 150], ["J", 150], ["K", 125], ["L", 100],
      ["M", 100], ["N", 100], ["O", 100], ["P", 100], ["Q", 100],
    ],
  },
  "2B": {
    area: "860.000",
    lots: [
      ["R", 100], ["S", 80], ["T", 80], ["U", 200], ["V", 80],
      ["W", 80], ["X", 80], ["Y", 80], ["Z", 80],
    ],
  },
  "3": {
    area: "674.000",
    lots: [["AA", 110], ["BB", 110], ["CC", 150], ["DD", 100], ["EE", 100], ["FF", 104]],
  },
  "4": {
    area: "802.000",
    lots: [["GG", 120], ["HH", 120], ["II", 100], ["JJ", 100], ["KK", 101], ["LL", 101], ["MM", 160]],
  },
};

// Lots P and Q are crossed out on the plan. Keep them off sale until the owner confirms.
const ON_HOLD_NOTE = "Crossed out on the area breakdown. Confirm with the owner before selling.";
const ON_HOLD = new Set(["P", "Q"]);

// Non-saleable areas: shown on the map, never reservable.
const OTHER_AREAS = [
  { code: "466-NN", type: "EXCLUDED", area: "2969.319", notes: "Excluded area" },
  { code: "466-OO", type: "ROAD_RIGHT_OF_WAY", area: "3292.710", notes: "Road right of way" },
  {
    code: "EASEMENT",
    type: "EASEMENT",
    area: "667.971",
    notes: "Easement. Possibly Lot 466-PP on the sketch plan; confirm.",
  },
] as const;

async function main() {
  const [project] = await db
    .insert(projects)
    .values(PROJECT)
    .onConflictDoUpdate({ target: projects.name, set: { grossArea: PROJECT.grossArea } })
    .returning();

  const lotRows: (typeof lots.$inferInsert)[] = [];

  for (const [blockName, { area, lots: blockLots }] of Object.entries(BLOCKS)) {
    const [block] = await db
      .insert(blocks)
      .values({ projectId: project.id, name: blockName, area })
      .onConflictDoUpdate({ target: [blocks.projectId, blocks.name], set: { area } })
      .returning();

    for (const [letter, lotArea] of blockLots) {
      const onHold = ON_HOLD.has(letter);
      lotRows.push({
        projectId: project.id,
        blockId: block.id,
        code: `466-${letter}`,
        type: "SALEABLE",
        status: onHold ? "UNAVAILABLE" : "AVAILABLE",
        area: lotArea.toFixed(3),
        notes: onHold ? ON_HOLD_NOTE : null,
      });
    }
  }

  for (const area of OTHER_AREAS) {
    lotRows.push({ ...area, projectId: project.id, status: "UNAVAILABLE" });
  }

  await db
    .insert(lots)
    .values(lotRows)
    .onConflictDoUpdate({
      target: [lots.projectId, lots.code],
      // status is deliberately not updated here
      set: {
        blockId: sql`excluded.block_id`,
        type: sql`excluded.type`,
        area: sql`excluded.area`,
        notes: sql`excluded.notes`,
      },
    });

  const saleable = lotRows.filter((l) => l.type === "SALEABLE").length;
  console.log(
    `Seeded ${PROJECT.name}: ${saleable} saleable lots, ${lotRows.length - saleable} other areas.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
