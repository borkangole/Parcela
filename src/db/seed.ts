// Seeds the Costa Preciosa project from the AAAC area breakdown (AAAC_System.pdf).
// Safe to run more than once: it updates existing rows instead of duplicating them,
// and never changes a lot's status after it's created (so re-seeding can't undo a sale).
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index";
import { BLOCKS, PROJECT } from "../data/costa-preciosa";
import { blocks, lots, projects } from "./schema";

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

  for (const { name: blockName, area, lots: blockLots } of BLOCKS) {
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
